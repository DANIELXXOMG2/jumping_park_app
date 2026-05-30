/**
 * check-docs-links — Phase 2 of the check:docs pipeline.
 *
 * Validates all internal cross-references in docs/ resolve to existing files.
 * Skips external URLs (http/https), anchors (#), and mailto: links.
 *
 * Exits 0 on clean, 1 with broken link errors on failure.
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectMarkdownFiles } from './check-docs-lint'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS_DIR = join(projectRoot, 'docs')

/**
 * Historical/legacy docs with known broken links — excluded from link checking.
 * These are kept for traceability only (marked `historical` in docs/README.md).
 */
const EXCLUDED_FROM_LINK_CHECK = [
	'docs/MANUAL_USUARIO.md',
	'docs/MANUAL_INSTALACION.md',
	'docs/INFORME_TECNICO_SPRINT_3.md',
	'docs/ESTRUCTURA_PROYECTO.md',
	'docs/ARQUITECTURA.md', // Spanish legacy; English reference at docs/reference/architecture.md is checked
]

export type BrokenLink = { file: string; line: number; target: string; message: string }

const LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g
const CODE_REF_PATTERN = /`((?:docs|tests|scripts|src)\/[^`]+(?:\.[a-zA-Z]{1,5}))`/g

export function findBrokenLinks(
	filePath: string,
	content: string,
): BrokenLink[] {
	const findings: BrokenLink[] = []
	const lines = content.split('\n')
	const fileDir = dirname(join(projectRoot, filePath))
	let inCodeFence = false

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const lineNumber = i + 1

		if (line.trimStart().startsWith('```')) {
			inCodeFence = !inCodeFence
			continue
		}

		if (inCodeFence) continue

		// Check markdown links
		for (const match of line.matchAll(LINK_PATTERN)) {
			const linkTarget = match[2]

			// Skip external, anchor, and mailto links
			if (
				linkTarget.startsWith('http') ||
				linkTarget.startsWith('#') ||
				linkTarget.startsWith('mailto:')
			) {
				continue
			}

			// Strip anchor from link target
			const pathPart = linkTarget.split('#')[0]
			if (!pathPart) continue

			// Resolve relative to file directory
			const resolved = pathPart.startsWith('/')
				? join(projectRoot, pathPart)
				: join(fileDir, pathPart)

			if (!existsSync(resolved)) {
				findings.push({
					file: filePath,
					line: lineNumber,
					target: linkTarget,
					message: `Broken link: target does not exist`,
				})
			}
		}

		// Check backtick-delimited repo paths (docs/, tests/, scripts/, src/)
		for (const match of line.matchAll(CODE_REF_PATTERN)) {
			const repoPath = match[1]

			// Skip paths with template variables or glob wildcards
			if (repoPath.includes('{') || repoPath.includes('*') || repoPath.includes('?')) continue

			// Skip line-range references (file.ext:L12-L30)
			const cleanPath = repoPath.split(':')[0]

			// Skip if the path ends with / (directory reference, not a file)
			if (cleanPath.endsWith('/')) continue

			const resolved = join(projectRoot, cleanPath)

			if (!existsSync(resolved)) {
				findings.push({
					file: filePath,
					line: lineNumber,
					target: repoPath,
					message: `Broken repo reference: file does not exist`,
				})
			}
		}
	}

	return findings
}

export async function runDocsLinks(): Promise<BrokenLink[]> {
	const files = await collectMarkdownFiles(DOCS_DIR)
	const allFindings: BrokenLink[] = []

	for (const file of files) {
		const relativePath = relative(projectRoot, file).replace(/\\/g, '/')

		// Skip historical/legacy docs with known broken links
		if (EXCLUDED_FROM_LINK_CHECK.includes(relativePath)) continue

		const content = await readFile(file, 'utf8')
		const findings = findBrokenLinks(relativePath, content)
		allFindings.push(...findings)
	}

	return allFindings
}

if (import.meta.main) {
	runDocsLinks()
		.then((findings) => {
			if (findings.length === 0) {
				console.log('[check:docs:links] ✅ All internal links resolve.')
				process.exit(0)
			}
			console.error(`[check:docs:links] ❌ ${String(findings.length)} broken link(s):`)
			for (const f of findings) {
				console.error(`  ${f.file}:${String(f.line)}: ${f.message} → ${f.target}`)
			}
			process.exit(1)
		})
		.catch((error: unknown) => {
			console.error('[check:docs:links] Fatal:', error instanceof Error ? error.message : String(error))
			process.exit(1)
		})
}
