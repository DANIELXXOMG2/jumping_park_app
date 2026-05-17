import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { optimize } from 'svgo'

const projectRoot = resolve(import.meta.dir, '..')
const mermaidBundlePath = fileURLToPath(
	import.meta.resolve('mermaid/dist/mermaid.min.js'),
)

export const DEFAULT_INPUT_DIR = join(projectRoot, 'diagramas')
export const DEFAULT_OUTPUT_DIR = join(projectRoot, 'docs', 'assets', 'diagrams')

export type DiagramJob = {
	inputPath: string
	outputPath: string
	diagramId: string
}

export type RenderSvgJob = DiagramJob & {
	source: string
}

export type RenderDiagramDependencies = {
	readDiagram: (inputPath: string) => Promise<string> | string
	renderSvg: (job: RenderSvgJob) => Promise<string> | string
	optimizeSvg: (svg: string, job: DiagramJob) => Promise<string> | string
	writeSvg: (outputPath: string, svg: string) => Promise<void> | void
}

export function resolveDiagramJobs(
	inputPaths: string[],
	outputDirPath: string,
): DiagramJob[] {
	return [...inputPaths]
		.sort((left, right) => left.localeCompare(right))
		.map((inputPath, index) => {
			const fileStem = basename(inputPath, extname(inputPath))

			return {
				inputPath,
				outputPath: join(outputDirPath, `${fileStem}.svg`),
				diagramId: `diagram-${String(index + 1).padStart(2, '0')}-${sanitizeDiagramId(fileStem)}`,
			}
		})
}

export async function renderDiagramJobs(
	jobs: DiagramJob[],
	dependencies: RenderDiagramDependencies,
): Promise<DiagramJob[]> {
	for (const job of jobs) {
		const source = await dependencies.readDiagram(job.inputPath)
		const renderedSvg = await dependencies.renderSvg({ ...job, source })
		const optimizedSvg = await dependencies.optimizeSvg(renderedSvg, job)
		await dependencies.writeSvg(job.outputPath, optimizedSvg)
	}

	return jobs
}

export async function findDiagramInputPaths(rootDirPath: string): Promise<string[]> {
	const entries = await readdir(rootDirPath, { withFileTypes: true })
	const inputPaths: string[] = []

	for (const entry of entries) {
		const entryPath = join(rootDirPath, entry.name)

		if (entry.isDirectory()) {
			inputPaths.push(...(await findDiagramInputPaths(entryPath)))
			continue
		}

		if (extname(entry.name).toLowerCase() === '.mmd') {
			inputPaths.push(entryPath)
		}
	}

	return inputPaths.sort((left, right) => left.localeCompare(right))
}

export function optimizeDiagramSvg(svg: string, job: DiagramJob): string {
	return optimize(svg, {
		path: job.outputPath,
		multipass: true,
		js2svg: {
			pretty: true,
			indent: 2,
		},
	}).data
}

export async function runRenderDiagrams(options?: {
	inputDir?: string
	outputDir?: string
}): Promise<DiagramJob[]> {
	const inputDir = options?.inputDir ?? DEFAULT_INPUT_DIR
	const outputDir = options?.outputDir ?? DEFAULT_OUTPUT_DIR
	const inputPaths = await findDiagramInputPaths(inputDir)

	if (inputPaths.length === 0) {
		throw new Error(`No Mermaid source files were found in ${inputDir}.`)
	}

	const jobs = resolveDiagramJobs(inputPaths, outputDir)
	const renderer = await createPlaywrightMermaidRenderer()

	try {
		return await renderDiagramJobs(jobs, {
			readDiagram: (inputPath) => readFile(inputPath, 'utf8'),
			renderSvg: ({ diagramId, source }) => renderer.render(diagramId, source),
			optimizeSvg: optimizeDiagramSvg,
			writeSvg: async (outputPath, svg) => {
				await mkdir(dirname(outputPath), { recursive: true })
				await writeFile(outputPath, svg, 'utf8')
			},
		})
	} finally {
		await renderer.close()
	}
}

type MermaidRenderer = {
	render: (diagramId: string, source: string) => Promise<string>
	close: () => Promise<void>
}

async function createPlaywrightMermaidRenderer(): Promise<MermaidRenderer> {
	try {
		const { chromium } = await import('@playwright/test')
		const browser = await chromium.launch({ headless: true })
		const page = await browser.newPage()

		await page.setContent('<html><body><div id="diagram-root"></div></body></html>')
		await page.addScriptTag({ path: mermaidBundlePath })
		await page.evaluate(() => {
			const mermaid = (globalThis as typeof globalThis & {
				mermaid?: { initialize: (config: Record<string, unknown>) => void }
			}).mermaid

			if (!mermaid) {
				throw new Error('Mermaid failed to load in the browser renderer.')
			}

			mermaid.initialize({
				startOnLoad: false,
				securityLevel: 'strict',
				theme: 'neutral',
			})
		})

		return {
			render: (diagramId, source) =>
				page.evaluate(
					async ({ currentDiagramId, currentSource }) => {
						const mermaid = (globalThis as typeof globalThis & {
							mermaid?: {
								render: (
									diagramIdValue: string,
									sourceValue: string,
								) => Promise<{ svg: string }>
							}
						}).mermaid

						if (!mermaid) {
							throw new Error('Mermaid is unavailable in the browser renderer.')
						}

						const { svg } = await mermaid.render(currentDiagramId, currentSource)
						return svg
					},
					{ currentDiagramId: diagramId, currentSource: source },
				),
			close: async () => {
				await page.close()
				await browser.close()
			},
		}
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error)

		throw new Error(
			[
				'Failed to initialize the Mermaid renderer with Playwright Chromium.',
				'Rendering Mermaid core in this repository depends on the existing Playwright browser runtime because mermaid itself needs a DOM.',
				`Reason: ${reason}`,
				'Run `bun run playwright:install` if Chromium has not been installed on this machine yet.',
			].join(' '),
		)
	}
}

function sanitizeDiagramId(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-')
}

function readCliOption(optionName: '--input-dir' | '--output-dir'): string | undefined {
	const optionIndex = process.argv.indexOf(optionName)

	if (optionIndex === -1) {
		return undefined
	}

	return process.argv[optionIndex + 1]
}

if (import.meta.main) {
	const inputDir = readCliOption('--input-dir')
	const outputDir = readCliOption('--output-dir')

	runRenderDiagrams({ inputDir, outputDir })
		.then((jobs) => {
			console.log(
				`Rendered ${jobs.length} Mermaid diagram(s) into ${outputDir ?? DEFAULT_OUTPUT_DIR}.`,
			)
		})
		.catch((error: unknown) => {
			console.error(
				error instanceof Error ? error.message : String(error),
			)
			process.exitCode = 1
		})
}
