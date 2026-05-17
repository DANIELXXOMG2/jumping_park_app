import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
	existsSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

type PackageJson = {
	scripts?: Record<string, string>
	devDependencies?: Record<string, string>
}

function readPackageJson(): PackageJson {
	return JSON.parse(
		readFileSync(join(projectRoot, 'package.json'), 'utf8'),
	) as PackageJson
}

describe('diagram tooling foundation stays truthful', () => {
	it('registers the diagram renderer command and the required dev dependencies', () => {
		const packageJson = readPackageJson()

		expect(packageJson.scripts?.['diagram:render']).toBe(
			'bun run scripts/render-diagrams.ts',
		)
		expect(typeof packageJson.devDependencies?.mermaid).toBe('string')
		expect(typeof packageJson.devDependencies?.svgo).toBe('string')
	})

	it('builds deterministic jobs and writes optimized svg outputs', async () => {
		const tempRoot = mkdtempSync(join(tmpdir(), 'jumping-park-diagrams-'))
		const inputDir = join(tempRoot, 'diagramas')
		const outputDir = join(tempRoot, 'docs', 'assets', 'diagrams')

		mkdirSync(inputDir, { recursive: true })
		writeFileSync(join(inputDir, 'b-sequence.mmd'), 'flowchart LR\nB-->C\n')
		writeFileSync(join(inputDir, 'a-er.mmd'), 'flowchart LR\nA-->B\n')

		try {
			const renderDiagramsModule = (await import(
				join(projectRoot, 'scripts', 'render-diagrams.ts')
			)) as {
				resolveDiagramJobs: (
					inputPaths: string[],
					outputDirPath: string,
				) => Array<{ inputPath: string; outputPath: string; diagramId: string }>
				renderDiagramJobs: (
					jobs: Array<{ inputPath: string; outputPath: string; diagramId: string }>,
					dependencies: {
						readDiagram: (inputPath: string) => Promise<string> | string
						renderSvg: (job: {
							inputPath: string
							outputPath: string
							diagramId: string
							source: string
						}) => Promise<string> | string
						optimizeSvg: (svg: string, job: {
							inputPath: string
							outputPath: string
							diagramId: string
						}) => Promise<string> | string
						writeSvg: (
							outputPath: string,
							svg: string,
						) => Promise<void> | void
					}
				) => Promise<Array<{ inputPath: string; outputPath: string; diagramId: string }>>
			}

			const jobs = renderDiagramsModule.resolveDiagramJobs(
				[join(inputDir, 'b-sequence.mmd'), join(inputDir, 'a-er.mmd')],
				outputDir,
			)

			expect(jobs).toEqual([
				{
					inputPath: join(inputDir, 'a-er.mmd'),
					outputPath: join(outputDir, 'a-er.svg'),
					diagramId: 'diagram-01-a-er',
				},
				{
					inputPath: join(inputDir, 'b-sequence.mmd'),
					outputPath: join(outputDir, 'b-sequence.svg'),
					diagramId: 'diagram-02-b-sequence',
				},
			])

			const renderedIds: string[] = []

			const completedJobs = await renderDiagramsModule.renderDiagramJobs(jobs, {
				readDiagram: (inputPath) => readFileSync(inputPath, 'utf8'),
				renderSvg: ({ diagramId, source }) => {
					renderedIds.push(diagramId)
					return `<svg><!-- ${diagramId} --><desc>${source.trim()}</desc></svg>`
				},
				optimizeSvg: (svg) => svg.replace('<svg', '<svg data-optimized="true"'),
				writeSvg: (outputPath, svg) => {
					mkdirSync(dirname(outputPath), { recursive: true })
					writeFileSync(outputPath, svg)
				},
			})

			expect(renderedIds).toEqual(['diagram-01-a-er', 'diagram-02-b-sequence'])
			expect(completedJobs).toEqual(jobs)
			expect(existsSync(join(outputDir, 'a-er.svg'))).toBe(true)
			expect(existsSync(join(outputDir, 'b-sequence.svg'))).toBe(true)
			expect(readFileSync(join(outputDir, 'a-er.svg'), 'utf8')).toContain(
				'data-optimized="true"',
			)
			expect(readFileSync(join(outputDir, 'b-sequence.svg'), 'utf8')).toContain(
				'flowchart LR',
			)
		} finally {
			rmSync(tempRoot, { recursive: true, force: true })
		}
	})
})
