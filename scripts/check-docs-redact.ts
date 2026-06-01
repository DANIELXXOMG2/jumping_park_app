/**
 * check-docs-redact — Phase 3 of the check:docs pipeline.
 *
 * Scans all docs/ markdown files for potential secrets, PII, and credentials:
 * - Long alphanumeric strings that look like API keys (≥20 chars)
 * - PEM private key blocks
 * - JWT tokens
 * - Hardcoded email addresses (outside example.com/example.org)
 * - Firebase-style long hex strings
 *
 * Non-blocking on pre-commit, blocking on merge.
 * Exits 0 on clean, 1 with findings on failure.
 */

import { readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectMarkdownFiles } from './check-docs-lint'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS_DIR = join(projectRoot, 'docs')

/**
 * Historical/legacy docs with known PII/secrets — excluded from redaction scanning.
 * These are kept for traceability only (marked `historical` in docs/README.md).
 */
const EXCLUDED_FROM_REDACT = [
	'docs/MANUAL_USUARIO.md',
	'docs/MANUAL_INSTALACION.md',
	'docs/INFORME_TECNICO_SPRINT_3.md',
	'docs/ESTRUCTURA_PROYECTO.md',
]

export type RedactionFinding = { file: string; line: number; pattern: string; message: string }

const SAFE_DOMAINS = ['example.com', 'example.org', 'example.net', 'localhost', 'your-project']

export function scanForSecrets(filePath: string, content: string): RedactionFinding[] {
	const findings: RedactionFinding[] = []
	const lines = content.split('\n')
	let inCodeFence = false

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const lineNumber = i + 1

		// Track code fences — skip scanning inside code blocks (examples are OK)
		if (line.trimStart().startsWith('```')) {
			inCodeFence = !inCodeFence
			continue
		}
		if (inCodeFence) continue

		// PEM private key blocks
		if (line.includes('-----BEGIN') && line.includes('KEY-----')) {
			findings.push({
				file: filePath,
				line: lineNumber,
				pattern: 'pem-key',
				message: 'Possible PEM private key block detected',
			})
		}

		// JWT tokens (eyJ...)
		if (/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./.test(line)) {
			findings.push({
				file: filePath,
				line: lineNumber,
				pattern: 'jwt',
				message: 'Possible JWT token detected',
			})
		}

		// Long alphanumeric strings that look like API keys
		// Exclude backtick-delimited paths and common false positives
		const stripped = line.replace(/`[^`]+`/g, '').replace(/\[[^\]]+\]/g, '')
		const apiKeyMatch = stripped.match(/(?:^|[=:]\s*)(["']?)[A-Za-z0-9_-]{20,}\1/)
		if (apiKeyMatch) {
			const value = apiKeyMatch[0]
			// Skip common false positives: markdown table separators, version strings, paths
			if (
				!value.includes('---') &&
				!value.includes('|') &&
				!value.includes('/') &&
				!value.includes('.md') &&
				!value.includes('.ts')
			) {
				findings.push({
					file: filePath,
					line: lineNumber,
					pattern: 'api-key',
					message: `Possible API key or long secret detected`,
				})
			}
		}

		// Email addresses outside safe domains
		const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
		for (const email of line.matchAll(emailPattern)) {
			const domain = email[0].split('@')[1]?.toLowerCase()
			if (domain && !SAFE_DOMAINS.some((safe) => domain === safe || domain.endsWith(`.${safe}`))) {
				findings.push({
					file: filePath,
					line: lineNumber,
					pattern: 'email',
					message: `Possible real email address: ${email[0]}`,
				})
			}
		}
	}

	return findings
}

export async function runDocsRedact(): Promise<RedactionFinding[]> {
	const files = await collectMarkdownFiles(DOCS_DIR)
	const allFindings: RedactionFinding[] = []

	for (const file of files) {
		const relativePath = relative(projectRoot, file).replace(/\\/g, '/')

		// Skip historical/legacy docs with known PII/secrets
		if (EXCLUDED_FROM_REDACT.includes(relativePath)) continue

		const content = await readFile(file, 'utf8')
		const findings = scanForSecrets(relativePath, content)
		allFindings.push(...findings)
	}

	return allFindings
}

if (import.meta.main) {
	runDocsRedact()
		.then((findings) => {
			if (findings.length === 0) {
				console.log('[check:docs:redact] ✅ No secrets or PII detected.')
				process.exit(0)
			}
			console.error(`[check:docs:redact] ❌ ${String(findings.length)} finding(s):`)
			for (const f of findings) {
				console.error(`  ${f.file}:${String(f.line)}: [${f.pattern}] ${f.message}`)
			}
			process.exit(1)
		})
		.catch((error: unknown) => {
			console.error('[check:docs:redact] Fatal:', error instanceof Error ? error.message : String(error))
			process.exit(1)
		})
}
