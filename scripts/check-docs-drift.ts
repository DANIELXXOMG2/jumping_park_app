/**
 * check-docs-drift — Phase 4 of the check:docs pipeline.
 *
 * Detects documentation drift:
 * - Docs with [NEEDS UPDATE: YYYY-MM-DD] older than 2 sprints (4 weeks)
 * - Docs with [STALE-AUDIT] markers
 * - Docs listed in docs/README.md as "current" that reference [UNVERIFIED] claims
 *
 * Generates a stale-docs report. Non-blocking by default (advisory).
 * Exits 0 with report on stdout, exits 1 only on fatal errors.
 */

import { readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectMarkdownFiles } from './check-docs-lint'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS_DIR = join(projectRoot, 'docs')

export type DriftFinding = {
	file: string
	line: number
	pattern: string
	message: string
	severity: 'warning' | 'info'
}

const TWO_SPRINTS_MS = 28 * 24 * 60 * 60 * 1000 // 4 weeks

export function detectDrift(filePath: string, content: string, now: Date): DriftFinding[] {
	const findings: DriftFinding[] = []
	const lines = content.split('\n')

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const lineNumber = i + 1

		// Check for [NEEDS UPDATE: YYYY-MM-DD] markers
		const needsUpdateMatch = line.match(/\[NEEDS UPDATE:\s*(\d{4}-\d{2}-\d{2})\]/)
		if (needsUpdateMatch) {
			const dateStr = needsUpdateMatch[1]
			const markerDate = new Date(dateStr)
			const ageMs = now.getTime() - markerDate.getTime()

			if (ageMs > TWO_SPRINTS_MS) {
				findings.push({
					file: filePath,
					line: lineNumber,
					pattern: 'needs-update',
					message: `[NEEDS UPDATE: ${dateStr}] is older than 2 sprints — consider downgrading to historical or updating`,
					severity: 'warning',
				})
			} else {
				findings.push({
					file: filePath,
					line: lineNumber,
					pattern: 'needs-update',
					message: `[NEEDS UPDATE: ${dateStr}] — within 2-sprint window`,
					severity: 'info',
				})
			}
		}

		// Check for [STALE-AUDIT] markers
		if (line.includes('[STALE-AUDIT]')) {
			findings.push({
				file: filePath,
				line: lineNumber,
				pattern: 'stale-audit',
				message: 'Document marked as [STALE-AUDIT] — needs re-audit before use',
				severity: 'warning',
			})
		}

		// Check for [UNVERIFIED] claims
		if (line.includes('[UNVERIFIED]')) {
			findings.push({
				file: filePath,
				line: lineNumber,
				pattern: 'unverified',
				message: 'Claim marked [UNVERIFIED] — needs external validation evidence',
				severity: 'info',
			})
		}
	}

	return findings
}

export async function runDocsDrift(now: Date = new Date()): Promise<DriftFinding[]> {
	const files = await collectMarkdownFiles(DOCS_DIR)
	const allFindings: DriftFinding[] = []

	for (const file of files) {
		const content = await readFile(file, 'utf8')
		const relativePath = relative(projectRoot, file).replace(/\\/g, '/')
		const findings = detectDrift(relativePath, content, now)
		allFindings.push(...findings)
	}

	return allFindings
}

if (import.meta.main) {
	runDocsDrift()
		.then((findings) => {
			const warnings = findings.filter((f) => f.severity === 'warning')
			const info = findings.filter((f) => f.severity === 'info')

			if (findings.length === 0) {
				console.log('[check:docs:drift] ✅ No drift markers found.')
				process.exit(0)
			}

			if (warnings.length > 0) {
				console.warn(`[check:docs:drift] ⚠️  ${String(warnings.length)} warning(s):`)
				for (const f of warnings) {
					console.warn(`  ${f.file}:${String(f.line)}: ${f.message}`)
				}
			}

			if (info.length > 0) {
				console.log(`[check:docs:drift] ℹ️  ${String(info.length)} info item(s):`)
				for (const f of info) {
					console.log(`  ${f.file}:${String(f.line)}: ${f.message}`)
				}
			}

			// Drift is advisory — always exit 0 unless there's a fatal condition
			process.exit(0)
		})
		.catch((error: unknown) => {
			console.error('[check:docs:drift] Fatal:', error instanceof Error ? error.message : String(error))
			process.exit(1)
		})
}
