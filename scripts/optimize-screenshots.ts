import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import sharp from 'sharp'
import { optimize } from 'svgo'

const projectRoot = resolve(import.meta.dir, '..')

export const DEFAULT_INPUT_DIR = join(
	projectRoot,
	'docs',
	'portfolio',
	'screenshots',
)
export const DEFAULT_OUTPUT_DIR = join(
	projectRoot,
	'docs',
	'assets',
	'screenshots',
)

const SCREENSHOT_FORMAT = {
	PNG: 'png',
	JPG: 'jpg',
	JPEG: 'jpeg',
	WEBP: 'webp',
	SVG: 'svg',
} as const

type ScreenshotFormat = (typeof SCREENSHOT_FORMAT)[keyof typeof SCREENSHOT_FORMAT]
type RasterScreenshotFormat =
	(typeof SCREENSHOT_FORMAT)[Exclude<
		keyof typeof SCREENSHOT_FORMAT,
		'SVG'
	>]

type OptimizedScreenshotOutput = string | Uint8Array

export type ScreenshotJob = {
	inputPath: string
	outputPath: string
	assetId: string
	format: ScreenshotFormat
}

export type OptimizeScreenshotDependencies = {
	readScreenshot: (inputPath: string) => Promise<Uint8Array> | Uint8Array
	optimizeScreenshot: (
		source: Uint8Array,
		job: ScreenshotJob,
	) => Promise<OptimizedScreenshotOutput> | OptimizedScreenshotOutput
	writeScreenshot: (
		outputPath: string,
		content: OptimizedScreenshotOutput,
		job: ScreenshotJob,
	) => Promise<void> | void
}

export async function findScreenshotInputPaths(rootDirPath: string): Promise<string[]> {
	const entries = await readdir(rootDirPath, { withFileTypes: true })
	const inputPaths: string[] = []

	for (const entry of entries) {
		const entryPath = join(rootDirPath, entry.name)

		if (entry.isDirectory()) {
			inputPaths.push(...(await findScreenshotInputPaths(entryPath)))
			continue
		}

		if (toScreenshotFormat(entry.name) !== null) {
			inputPaths.push(entryPath)
		}
	}

	return inputPaths.sort((left, right) => left.localeCompare(right))
}

export function resolveScreenshotJobs(
	inputPaths: string[],
	outputDirPath: string,
): ScreenshotJob[] {
	return [...inputPaths]
		.sort((left, right) => left.localeCompare(right))
		.map((inputPath, index) => {
			const fileStem = basename(inputPath, extname(inputPath))
			const format = toScreenshotFormat(inputPath)

			if (format === null) {
				throw new Error(`Unsupported screenshot format for ${inputPath}.`)
			}

			return {
				inputPath,
				outputPath: join(outputDirPath, `${fileStem}.${format}`),
				assetId: `screenshot-${String(index + 1).padStart(2, '0')}-${sanitizeAssetId(fileStem)}`,
				format,
			}
		})
}

export async function optimizeScreenshotJobs(
	jobs: ScreenshotJob[],
	dependencies: OptimizeScreenshotDependencies,
): Promise<ScreenshotJob[]> {
	for (const job of jobs) {
		const source = await dependencies.readScreenshot(job.inputPath)
		const optimized = await dependencies.optimizeScreenshot(source, job)
		await dependencies.writeScreenshot(job.outputPath, optimized, job)
	}

	return jobs
}

export async function optimizeScreenshotAsset(
	source: Uint8Array,
	job: ScreenshotJob,
): Promise<OptimizedScreenshotOutput> {
	if (job.format === SCREENSHOT_FORMAT.SVG) {
		return optimizeSvgScreenshot(new TextDecoder().decode(source), job)
	}

	return optimizeRasterScreenshot(source, job.format)
}

export async function runOptimizeScreenshots(options?: {
	inputDir?: string
	outputDir?: string
}): Promise<ScreenshotJob[]> {
	const inputDir = options?.inputDir ?? DEFAULT_INPUT_DIR
	const outputDir = options?.outputDir ?? DEFAULT_OUTPUT_DIR
	const inputPaths = await findScreenshotInputPaths(inputDir)

	if (inputPaths.length === 0) {
		throw new Error(`No screenshot source files were found in ${inputDir}.`)
	}

	const jobs = resolveScreenshotJobs(inputPaths, outputDir)

	return optimizeScreenshotJobs(jobs, {
		readScreenshot: (inputPath) => readFile(inputPath),
		optimizeScreenshot: optimizeScreenshotAsset,
		writeScreenshot: async (outputPath, content) => {
			await mkdir(dirname(outputPath), { recursive: true })

			if (typeof content === 'string') {
				await writeFile(outputPath, content, 'utf8')
				return
			}

			await writeFile(outputPath, content)
		},
	})
}

export function optimizeSvgScreenshot(svg: string, job: ScreenshotJob): string {
	return optimize(svg, {
		path: job.outputPath,
		multipass: true,
		js2svg: {
			pretty: true,
			indent: 2,
		},
	}).data
}

async function optimizeRasterScreenshot(
	source: Uint8Array,
	format: RasterScreenshotFormat,
): Promise<Uint8Array> {
	const pipeline = sharp(source).rotate()

	switch (format) {
		case SCREENSHOT_FORMAT.PNG:
			return pipeline
				.png({ compressionLevel: 9, palette: true, quality: 85 })
				.toBuffer()
		case SCREENSHOT_FORMAT.JPG:
		case SCREENSHOT_FORMAT.JPEG:
			return pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
		case SCREENSHOT_FORMAT.WEBP:
			return pipeline.webp({ quality: 82 }).toBuffer()
		default:
			throw new Error(`Unsupported raster screenshot format: ${format}`)
	}
}

function toScreenshotFormat(filePath: string): ScreenshotFormat | null {
	const extension = extname(filePath).toLowerCase()

	switch (extension) {
		case '.png':
			return SCREENSHOT_FORMAT.PNG
		case '.jpg':
			return SCREENSHOT_FORMAT.JPG
		case '.jpeg':
			return SCREENSHOT_FORMAT.JPEG
		case '.webp':
			return SCREENSHOT_FORMAT.WEBP
		case '.svg':
			return SCREENSHOT_FORMAT.SVG
		default:
			return null
	}
}

function sanitizeAssetId(value: string): string {
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

	runOptimizeScreenshots({ inputDir, outputDir })
		.then((jobs) => {
			console.log(
				`Optimized ${jobs.length} screenshot asset(s) into ${outputDir ?? DEFAULT_OUTPUT_DIR}.`,
			)
		})
		.catch((error: unknown) => {
			console.error(error instanceof Error ? error.message : String(error))
			process.exitCode = 1
		})
}
