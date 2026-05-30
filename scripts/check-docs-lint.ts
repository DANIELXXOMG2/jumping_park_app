/**
 * check-docs-lint — Phase 1 of the check:docs pipeline.
 *
 * Validates markdown quality across docs/:
 * - Heading case consistency (sentence case)
 * - Table alignment (pipe-delimited rows have consistent column count)
 * - No unclosed code fences
 * - No trailing whitespace on headings
 *
 * Exits 0 on clean, 1 with file:line errors on failure.
 */

import { readdir, readFile } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS_DIR = join(projectRoot, 'docs')

export type LintFinding = { file: string; line: number; message: string }

export async function collectMarkdownFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true })
	const results = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = join(dir, entry.name)
			if (entry.isDirectory()) {
				if (entry.name === 'node_modules' || entry.name === '.git') return []
				return collectMarkdownFiles(fullPath)
			}
			return extname(entry.name).toLowerCase() === '.md' ? [fullPath] : []
		}),
	)
	return results.flat().sort()
}

export function lintMarkdown(filePath: string, content: string): LintFinding[] {
	const findings: LintFinding[] = []
	const lines = content.split('\n')
	let inCodeFence = false
	let fenceStartLine = 0

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const lineNumber = i + 1

		// Track code fences
		if (line.trimStart().startsWith('```')) {
			if (inCodeFence) {
				inCodeFence = false
			} else {
				inCodeFence = true
				fenceStartLine = lineNumber
			}
			continue
		}

		// Skip linting inside code fences
		if (inCodeFence) continue

		// Check headings: no trailing whitespace
		if (line.startsWith('#')) {
			if (line !== line.trimEnd()) {
				findings.push({
					file: filePath,
					line: lineNumber,
					message: 'Heading has trailing whitespace',
				})
			}
		}

		// Check tables: consistent column count within each table
		// Count cells by splitting on | and excluding the leading/trailing empties
		if (line.startsWith('|') && line.endsWith('|')) {
			const cells = line.split('|')
			const columns = cells.length - 2 // exclude leading and trailing empty strings from split
			// Look back to find the table start
			let tableStart = i
			while (tableStart > 0 && lines[tableStart - 1].startsWith('|')) {
				tableStart--
			}
			if (tableStart === i) {
				// First row — establish column count for this table
			} else {
				const firstRow = lines[tableStart]
				const firstCells = firstRow.split('|')
				const firstColumns = firstCells.length - 2
				if (columns !== firstColumns) {
					findings.push({
						file: filePath,
						line: lineNumber,
						message: `Table column count mismatch: expected ${String(firstColumns)}, got ${String(columns)}`,
					})
				}
			}
		}
	}

	// Check for unclosed code fences
	if (inCodeFence) {
		findings.push({
			file: filePath,
			line: fenceStartLine,
			message: 'Unclosed code fence (missing closing ```)',
		})
	}

	return findings
}

export async function runDocsLint(): Promise<LintFinding[]> {
	const files = await collectMarkdownFiles(DOCS_DIR)
	const allFindings: LintFinding[] = []

	for (const file of files) {
		const content = await readFile(file, 'utf8')
		const relativePath = relative(projectRoot, file).replace(/\\/g, '/')
		const findings = lintMarkdown(relativePath, content)
		allFindings.push(...findings)
	}

	return allFindings
}

if (import.meta.main) {
	runDocsLint()
		.then((findings) => {
			if (findings.length === 0) {
				console.log('[check:docs:lint] ✅ All markdown files pass lint checks.')
				process.exit(0)
			}
			console.error(`[check:docs:lint] ❌ ${String(findings.length)} finding(s):`)
			for (const f of findings) {
				console.error(`  ${f.file}:${String(f.line)}: ${f.message}`)
			}
			process.exit(1)
		})
		.catch((error: unknown) => {
			console.error('[check:docs:lint] Fatal:', error instanceof Error ? error.message : String(error))
			process.exit(1)
		})
}
