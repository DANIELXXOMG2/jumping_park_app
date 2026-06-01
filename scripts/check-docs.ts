/**
 * check-docs — 4-phase documentation quality pipeline.
 *
 * Runs in sequence:
 *   Phase 1: lint   — markdown quality (headings, tables, code fences)
 *   Phase 2: links  — internal cross-reference resolution
 *   Phase 3: redact — secret/PII regex scanning
 *   Phase 4: drift  — stale audit detection (advisory)
 *
 * Each phase can also run independently via:
 *   bun run check:docs:lint
 *   bun run check:docs:links
 *   bun run check:docs:redact
 *   bun run check:docs:drift
 *
 * Exits 0 when all blocking phases pass, 1 on any failure.
 */

import { runDocsLint } from './check-docs-lint'
import { runDocsLinks } from './check-docs-links'
import { runDocsRedact } from './check-docs-redact'
import { runDocsDrift } from './check-docs-drift'

export type PhaseResult = {
	phase: string
	passed: boolean
	findings: number
	blocking: boolean
}

export async function runCheckDocs(): Promise<PhaseResult[]> {
	const results: PhaseResult[] = []

	// Phase 1 — lint
	console.log('[check:docs] Phase 1/4: lint')
	const lintFindings = await runDocsLint()
	results.push({
		phase: 'lint',
		passed: lintFindings.length === 0,
		findings: lintFindings.length,
		blocking: true,
	})
	if (lintFindings.length > 0) {
		for (const f of lintFindings) {
			console.error(`  ${f.file}:${String(f.line)}: ${f.message}`)
		}
	}

	// Phase 2 — links (only if lint passed)
	if (results[0].passed) {
		console.log('[check:docs] Phase 2/4: links')
		const linkFindings = await runDocsLinks()
		results.push({
			phase: 'links',
			passed: linkFindings.length === 0,
			findings: linkFindings.length,
			blocking: true,
		})
		if (linkFindings.length > 0) {
			for (const f of linkFindings) {
				console.error(`  ${f.file}:${String(f.line)}: ${f.message} → ${f.target}`)
			}
		}
	} else {
		results.push({ phase: 'links', passed: false, findings: 0, blocking: true })
		console.log('[check:docs] Phase 2/4: links — SKIPPED (lint failed)')
	}

	// Phase 3 — redaction (only if links passed)
	if (results[1].passed) {
		console.log('[check:docs] Phase 3/4: redact')
		const redactFindings = await runDocsRedact()
		results.push({
			phase: 'redact',
			passed: redactFindings.length === 0,
			findings: redactFindings.length,
			blocking: true,
		})
		if (redactFindings.length > 0) {
			for (const f of redactFindings) {
				console.error(`  ${f.file}:${String(f.line)}: [${f.pattern}] ${f.message}`)
			}
		}
	} else {
		results.push({ phase: 'redact', passed: false, findings: 0, blocking: true })
		console.log('[check:docs] Phase 3/4: redact — SKIPPED (links failed)')
	}

	// Phase 4 — drift (always runs — advisory)
	console.log('[check:docs] Phase 4/4: drift')
	const driftFindings = await runDocsDrift()
	const warnings = driftFindings.filter((f) => f.severity === 'warning')
	results.push({
		phase: 'drift',
		passed: warnings.length === 0,
		findings: driftFindings.length,
		blocking: false,
	})
	if (driftFindings.length > 0) {
		for (const f of driftFindings) {
			const prefix = f.severity === 'warning' ? '⚠️' : 'ℹ️'
			console.log(`  ${prefix} ${f.file}:${String(f.line)}: ${f.message}`)
		}
	}

	return results
}

if (import.meta.main) {
	runCheckDocs()
		.then((results) => {
			console.log('\n[check:docs] Summary:')
			for (const r of results) {
				const status = r.passed ? '✅' : '❌'
				const blocking = r.blocking ? 'blocking' : 'advisory'
				console.log(`  ${status} ${r.phase}: ${String(r.findings)} finding(s) (${blocking})`)
			}

			const blockingFailed = results.filter((r) => r.blocking && !r.passed)
			if (blockingFailed.length > 0) {
				console.error(`\n[check:docs] FAILED — ${String(blockingFailed.length)} blocking phase(s) failed.`)
				process.exit(1)
			}

			console.log('\n[check:docs] ✅ All blocking phases passed.')
			process.exit(0)
		})
		.catch((error: unknown) => {
			console.error('[check:docs] Fatal:', error instanceof Error ? error.message : String(error))
			process.exit(1)
		})
}
