import { spawnSync } from 'node:child_process'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import sharp from 'sharp'

const projectRoot = process.cwd()

type PackageJson = {
	scripts?: Record<string, string>
}

function readPackageJson(): PackageJson {
	return JSON.parse(
		readFileSync(join(projectRoot, 'package.json'), 'utf8'),
	) as PackageJson
}

describe('screenshot tooling foundation stays truthful', () => {
	it('registers the screenshot optimizer command and script file', () => {
		const packageJson = readPackageJson()

		expect(packageJson.scripts?.['optimize:screenshots']).toBe(
			'bun run scripts/optimize-screenshots.ts',
		)
		expect(
			existsSync(join(projectRoot, 'scripts', 'optimize-screenshots.ts')),
		).toBe(true)
	})

	it('finds supported screenshot files and resolves deterministic jobs', async () => {
		const tempRoot = mkdtempSync(join(tmpdir(), 'jumping-park-screenshot-jobs-'))
		const inputDir = join(tempRoot, 'docs', 'portfolio', 'screenshots')
		const outputDir = join(tempRoot, 'docs', 'assets', 'screenshots')

		mkdirSync(join(inputDir, 'nested'), { recursive: true })
		writeFileSync(join(inputDir, 'b-dashboard.PNG'), 'png source')
		writeFileSync(join(inputDir, 'a-public-hero.svg'), '<svg><!-- hero --></svg>')
		writeFileSync(join(inputDir, 'nested', 'c-kiosk-flow.webp'), 'webp source')
		writeFileSync(join(inputDir, 'README.md'), 'ignored')

		try {
			const screenshotsModule = (await import(
				join(projectRoot, 'scripts', 'optimize-screenshots.ts')
			)) as {
				findScreenshotInputPaths: (rootDirPath: string) => Promise<string[]>
				resolveScreenshotJobs: (
					inputPaths: string[],
					outputDirPath: string,
				) => Array<{
					inputPath: string
					outputPath: string
					assetId: string
					format: string
				}>
			}

			const inputPaths = await screenshotsModule.findScreenshotInputPaths(inputDir)

			expect(inputPaths).toEqual([
				join(inputDir, 'a-public-hero.svg'),
				join(inputDir, 'b-dashboard.PNG'),
				join(inputDir, 'nested', 'c-kiosk-flow.webp'),
			])

			expect(
				screenshotsModule.resolveScreenshotJobs(inputPaths, outputDir),
			).toEqual([
				{
					inputPath: join(inputDir, 'a-public-hero.svg'),
					outputPath: join(outputDir, 'a-public-hero.svg'),
					assetId: 'screenshot-01-a-public-hero',
					format: 'svg',
				},
				{
					inputPath: join(inputDir, 'b-dashboard.PNG'),
					outputPath: join(outputDir, 'b-dashboard.png'),
					assetId: 'screenshot-02-b-dashboard',
					format: 'png',
				},
				{
					inputPath: join(inputDir, 'nested', 'c-kiosk-flow.webp'),
					outputPath: join(outputDir, 'c-kiosk-flow.webp'),
					assetId: 'screenshot-03-c-kiosk-flow',
					format: 'webp',
				},
			])
		} finally {
			rmSync(tempRoot, { recursive: true, force: true })
		}
	})

	it('optimizes raster and svg screenshots into the output directory', async () => {
		const tempRoot = mkdtempSync(join(tmpdir(), 'jumping-park-screenshot-run-'))
		const inputDir = join(tempRoot, 'docs', 'portfolio', 'screenshots')
		const outputDir = join(tempRoot, 'docs', 'assets', 'screenshots')

		mkdirSync(inputDir, { recursive: true })

		await sharp({
			create: {
				width: 320,
				height: 180,
				channels: 4,
				background: { r: 46, g: 204, b: 113, alpha: 1 },
			},
		})
			.png()
			.toFile(join(inputDir, 'admin-dashboard.png'))

		writeFileSync(
			join(inputDir, 'public-hero.svg'),
			'<svg><!-- keep me honest --><rect width="100" height="50" fill="#2ecc71"></rect></svg>',
		)

		try {
			const screenshotsModule = (await import(
				join(projectRoot, 'scripts', 'optimize-screenshots.ts')
			)) as {
				runOptimizeScreenshots: (options?: {
					inputDir?: string
					outputDir?: string
				}) => Promise<Array<{ assetId: string }>>
			}

			const completedJobs = await screenshotsModule.runOptimizeScreenshots({
				inputDir,
				outputDir,
			})

			expect(completedJobs.map((job) => job.assetId)).toEqual([
				'screenshot-01-admin-dashboard',
				'screenshot-02-public-hero',
			])

			expect(existsSync(join(outputDir, 'admin-dashboard.png'))).toBe(true)
			expect(existsSync(join(outputDir, 'public-hero.svg'))).toBe(true)

			const rasterMetadata = await sharp(
				join(outputDir, 'admin-dashboard.png'),
			).metadata()
			const optimizedSvg = readFileSync(
				join(outputDir, 'public-hero.svg'),
				'utf8',
			)

			expect(rasterMetadata.format).toBe('png')
			expect(optimizedSvg).toContain('<svg')
			expect(optimizedSvg).not.toContain('<!-- keep me honest -->')
		} finally {
			rmSync(tempRoot, { recursive: true, force: true })
		}
	})

	it('fails fast when a CLI flag is missing its value', () => {
		const result = spawnSync('bun', [
			'run',
			'scripts/optimize-screenshots.ts',
			'--output-dir',
		], {
			cwd: projectRoot,
			encoding: 'utf8',
		})

		expect(result.status).toBe(1)
		expect(result.stderr).toContain('Missing value for --output-dir.')
	})
})
