import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { optimize } from 'svgo'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const DEFAULT_INPUT_DIR = join(projectRoot, 'diagramas')
export const DEFAULT_OUTPUT_DIR = join(projectRoot, 'docs', 'assets', 'diagrams')

export type DiagramJob = { inputPath: string; outputPath: string; diagramId: string }
type RenderSvgJob = DiagramJob & { source: string }
type RenderDeps = {
	readDiagram: (inputPath: string) => Promise<string> | string
	renderSvg: (job: RenderSvgJob) => Promise<string> | string
	optimizeSvg: (svg: string, job: DiagramJob) => Promise<string> | string
	writeSvg: (outputPath: string, svg: string) => Promise<void> | void
}

export function resolveDiagramJobs(inputPaths: string[], outputDirPath: string): DiagramJob[] {
	return [...inputPaths].sort().map((inputPath, index) => {
		const stem = basename(inputPath, extname(inputPath))
		return {
			inputPath,
			outputPath: join(outputDirPath, `${stem}.svg`),
			diagramId: `diagram-${String(index + 1).padStart(2, '0')}-${sanitizeDiagramId(stem)}`,
		}
	})
}

export async function renderDiagramJobs(jobs: DiagramJob[], deps: RenderDeps): Promise<DiagramJob[]> {
	for (const job of jobs) {
		const source = await deps.readDiagram(job.inputPath)
		const rendered = await deps.renderSvg({ ...job, source })
		const optimized = await deps.optimizeSvg(rendered, job)
		await deps.writeSvg(job.outputPath, optimized)
	}
	return jobs
}

export async function findDiagramInputPaths(rootDirPath: string): Promise<string[]> {
	const entries = await readdir(rootDirPath, { withFileTypes: true })
	const results = await Promise.all(entries.map(async (entry) => {
		const entryPath = join(rootDirPath, entry.name)
		if (entry.isDirectory()) return findDiagramInputPaths(entryPath)
		return extname(entry.name).toLowerCase() === '.mmd' ? [entryPath] : []
	}))
	return results.flat().sort()
}

export function optimizeDiagramSvg(svg: string, job: DiagramJob): string {
  try {
    return optimize(svg, {
      path: job.outputPath,
      multipass: false,
      plugins: [
        'preset-default',
        { name: 'removeDimensions' },
      ],
      js2svg: { pretty: true, indent: 2 },
    }).data
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn(`[diagram:render] SVGO optimization skipped for ${job.diagramId}: ${reason}. The unoptimized SVG will be written as-is.`)
    return svg
  }
}

export async function runRenderDiagrams(options?: { inputDir?: string; outputDir?: string }): Promise<DiagramJob[]> {
  if ('Bun' in globalThis) {
    throw new Error(
      'diagram:render must run under Node.js, not Bun. The Playwright Chromium launch API is incompatible with the Bun runtime. ' +
      'Use the package.json script: bun run diagram:render (it auto-builds for Node.js).'
    )
  }

  const inputDir = options?.inputDir ?? DEFAULT_INPUT_DIR
	const outputDir = options?.outputDir ?? DEFAULT_OUTPUT_DIR
	const inputPaths = await findDiagramInputPaths(inputDir)
	if (inputPaths.length === 0) throw new Error(`No Mermaid source files were found in ${inputDir}.`)

	const bundlePath = fileURLToPath(import.meta.resolve('mermaid/dist/mermaid.min.js'))
	const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch({ headless: true, timeout: 30000 })
	const page = await browser.newPage()

	try {
		await page.setContent('<html><body><div id="diagram-root"></div></body></html>')
		await page.addScriptTag({ path: bundlePath })
		await page.evaluate(() => {
			const mermaidCandidate = Reflect.get(globalThis, 'mermaid')
			const mermaid =
				typeof mermaidCandidate === 'object' &&
				mermaidCandidate !== null &&
				'initialize' in mermaidCandidate &&
				typeof Reflect.get(mermaidCandidate, 'initialize') === 'function'
					? mermaidCandidate
					: undefined
			if (!mermaid) throw new Error('Mermaid failed to load in the browser renderer.')
			mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
		})

		return await renderDiagramJobs(resolveDiagramJobs(inputPaths, outputDir), {
			readDiagram: (inputPath) => readFile(inputPath, 'utf8'),
			renderSvg: ({ diagramId, source }) => page.evaluate(async ({ currentDiagramId, currentSource }) => {
				const mermaidCandidate = Reflect.get(globalThis, 'mermaid')
				const mermaid =
					typeof mermaidCandidate === 'object' &&
					mermaidCandidate !== null &&
					'render' in mermaidCandidate &&
					typeof Reflect.get(mermaidCandidate, 'render') === 'function'
						? mermaidCandidate
						: undefined
				if (!mermaid) throw new Error('Mermaid is unavailable in the browser renderer.')
				return (await mermaid.render(currentDiagramId, currentSource)).svg
			}, { currentDiagramId: diagramId, currentSource: source }),
			optimizeSvg: optimizeDiagramSvg,
			writeSvg: async (outputPath, svg) => {
				await mkdir(dirname(outputPath), { recursive: true })
				await writeFile(outputPath, svg, 'utf8')
			},
		})
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to initialize the Mermaid renderer with Playwright Chromium. Rendering Mermaid core in this repository depends on the existing Playwright browser runtime because mermaid itself needs a DOM. Reason: ${reason} Run \`bun run playwright:install\` if Chromium has not been installed on this machine yet.`)
	} finally {
		await page.close().catch(() => undefined)
		await browser.close().catch(() => undefined)
	}
}

function sanitizeDiagramId(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')
}

function readCliOption(optionName: '--input-dir' | '--output-dir'): string | undefined {
	const optionIndex = process.argv.indexOf(optionName)
	return optionIndex === -1 ? undefined : process.argv[optionIndex + 1]
}

if (import.meta.main) {
	runRenderDiagrams({
		inputDir: readCliOption('--input-dir'),
		outputDir: readCliOption('--output-dir'),
	})
		.then((jobs) => console.log(`Rendered ${jobs.length} Mermaid diagram(s) into ${readCliOption('--output-dir') ?? DEFAULT_OUTPUT_DIR}.`))
		.catch((error: unknown) => {
			console.error(error instanceof Error ? error.message : String(error))
			process.exitCode = 1
		})
}
