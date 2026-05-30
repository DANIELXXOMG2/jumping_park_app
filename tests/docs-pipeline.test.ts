import { describe, expect, it } from 'bun:test'
import { lintMarkdown, type LintFinding } from '../scripts/check-docs-lint'
import { findBrokenLinks, type BrokenLink } from '../scripts/check-docs-links'
import { scanForSecrets, type RedactionFinding } from '../scripts/check-docs-redact'
import { detectDrift, type DriftFinding } from '../scripts/check-docs-drift'

describe('Phase 1: lint detects markdown quality issues', () => {
	it('passes on well-formed markdown', () => {
		const content = '# Hello World\n\nSome content.\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n'
		const findings = lintMarkdown('docs/test.md', content)
		expect(findings.length).toBe(0)
	})

	it('detects trailing whitespace on headings', () => {
		const content = '# Hello World   \n\nContent.\n'
		const findings = lintMarkdown('docs/test.md', content)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].message).toContain('trailing whitespace')
	})

	it('detects unclosed code fences', () => {
		const content = '# Title\n\n```typescript\nconst x = 1\n'
		const findings = lintMarkdown('docs/test.md', content)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].message).toContain('Unclosed code fence')
	})

	it('detects table column count mismatch', () => {
		const content = '# Title\n\n| A | B | C |\n| --- | --- | --- |\n| 1 | 2 |\n'
		const findings = lintMarkdown('docs/test.md', content)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].message).toContain('column count mismatch')
	})

	it('ignores content inside code fences', () => {
		const content = '# Title\n\n```\n# Heading with trailing spaces   \n| A | B |\n| 1 | 2 | 3 |\n```\n'
		const findings = lintMarkdown('docs/test.md', content)
		expect(findings.length).toBe(0)
	})
})

describe('Phase 2: links detects broken references', () => {
	it('passes when all links resolve', () => {
		const content = 'See [README](README.md) for details.\n'
		const findings = findBrokenLinks('docs/test.md', content)
		expect(findings.length).toBe(0)
	})

	it('detects broken markdown links', () => {
		const content = 'See [missing](docs/nonexistent-file.md) for details.\n'
		const findings = findBrokenLinks('docs/test.md', content)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].target).toContain('nonexistent-file.md')
	})

	it('skips external URLs', () => {
		const content = 'Visit [Google](https://google.com) for search.\n'
		const findings = findBrokenLinks('docs/test.md', content)
		expect(findings.length).toBe(0)
	})

	it('skips anchor-only links', () => {
		const content = 'Jump to [section](#section-name).\n'
		const findings = findBrokenLinks('docs/test.md', content)
		expect(findings.length).toBe(0)
	})

	it('detects broken backtick repo references', () => {
		const content = 'See `src/nonexistent/module.ts` for the code.\n'
		const findings = findBrokenLinks('docs/test.md', content)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].target).toContain('nonexistent/module.ts')
	})

	it('passes for existing backtick repo references', () => {
		const content = 'See `tests/docs-pipeline.test.ts` for config.\n'
		const findings = findBrokenLinks('docs/test.md', content)
		expect(findings.length).toBe(0)
	})

	it('ignores backtick repo references inside code fences', () => {
		const content = '# Title\n\n```ts\nSee `src/nonexistent/module.ts` for config.\n```\n'
		const findings = findBrokenLinks('docs/test.md', content)
		expect(findings.length).toBe(0)
	})
})

describe('Phase 3: redact detects secrets and PII', () => {
	it('passes on clean content', () => {
		const content = '# Title\n\nNo secrets here.\n'
		const findings = scanForSecrets('docs/test.md', content)
		expect(findings.length).toBe(0)
	})

	it('detects PEM key blocks', () => {
		const content = '# Title\n\n-----BEGIN RSA PRIVATE KEY-----\n'
		const findings = scanForSecrets('docs/test.md', content)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].pattern).toBe('pem-key')
	})

	it('detects JWT tokens', () => {
		const content = '# Title\n\nToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U\n'
		const findings = scanForSecrets('docs/test.md', content)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].pattern).toBe('jwt')
	})

	it('ignores safe example.com emails', () => {
		const content = '# Title\n\nContact user@example.com for help.\n'
		const findings = scanForSecrets('docs/test.md', content)
		expect(findings.length).toBe(0)
	})

	it('ignores content inside code fences', () => {
		const content = '# Title\n\n```\nAPI_KEY=sk-1234567890abcdef1234567890\n```\n'
		const findings = scanForSecrets('docs/test.md', content)
		expect(findings.length).toBe(0)
	})
})

describe('Phase 4: drift detects stale markers', () => {
	const now = new Date('2026-05-30')

	it('passes on clean content', () => {
		const content = '# Title\n\nAll good.\n'
		const findings = detectDrift('docs/test.md', content, now)
		expect(findings.length).toBe(0)
	})

	it('detects [STALE-AUDIT] markers', () => {
		const content = '# Title\n\n[STALE-AUDIT] This doc needs review.\n'
		const findings = detectDrift('docs/test.md', content, now)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].pattern).toBe('stale-audit')
		expect(findings[0].severity).toBe('warning')
	})

	it('detects [UNVERIFIED] claims', () => {
		const content = '# Title\n\n[UNVERIFIED] Performance claim.\n'
		const findings = detectDrift('docs/test.md', content, now)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].pattern).toBe('unverified')
		expect(findings[0].severity).toBe('info')
	})

	it('flags old [NEEDS UPDATE] markers as warning', () => {
		const content = '# Title\n\n[NEEDS UPDATE: 2026-01-01] Stale section.\n'
		const findings = detectDrift('docs/test.md', content, now)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].pattern).toBe('needs-update')
		expect(findings[0].severity).toBe('warning')
	})

	it('marks recent [NEEDS UPDATE] as info', () => {
		const content = '# Title\n\n[NEEDS UPDATE: 2026-05-20] Recent note.\n'
		const findings = detectDrift('docs/test.md', content, now)
		expect(findings.length).toBeGreaterThan(0)
		expect(findings[0].severity).toBe('info')
	})
})
