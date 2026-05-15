import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'

const repoRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function runGit(args: string[]): string {
	return execFileSync('git', args, {
		cwd: repoRoot,
		encoding: 'utf8',
	}).trimEnd()
}

function runPrecheck() {
	const result = spawnSync(process.execPath, ['run', 'scripts/git-history-mp4-precheck.ts'], {
		cwd: repoRoot,
		encoding: 'utf8',
	})

	if (result.error) {
		throw result.error
	}

	return result
}

describe('git history MP4 purge runbook', () => {
	it('documents the required dry-run, execution, verification, rollback, and coordination flow', () => {
		const runbook = readProjectFile('docs/runbooks/git-history-mp4-purge.md')

		expect(runbook).toContain('# Git history MP4 purge runbook')
		expect(runbook).toContain('## Quick path')
		expect(runbook).toContain('## Dry-run / precheck')
		expect(runbook).toContain('## Execution')
		expect(runbook).toContain('## Verification')
		expect(runbook).toContain('## Rollback')
		expect(runbook).toContain('## Team coordination')
		expect(runbook).toContain('public/assets/hero-video.mp4')
		expect(runbook).toContain('public/assets/hero-opt.mp4')
		expect(runbook).toContain('git filter-repo')
		expect(runbook).toContain('git count-objects -vH')
		expect(runbook).toContain('fresh clone')
		expect(runbook).toContain('bun run scripts/git-history-mp4-precheck.ts')
	})
})

describe('git history MP4 purge precheck script', () => {
	it('reports the historical MP4 targets and current pack statistics without running the rewrite', () => {
		const result = runPrecheck()

		expect(result.status).toBe(0)
		expect(result.stdout).toContain('public/assets/hero-video.mp4')
		expect(result.stdout).toContain('public/assets/hero-opt.mp4')
		expect(result.stdout).toContain('size-pack:')
		expect(result.stdout).toContain('No history rewrite was executed.')
		expect(result.stdout).toContain('docs/runbooks/git-history-mp4-purge.md')
	})

	it('leaves git status unchanged after the dry run', () => {
		const before = runGit(['status', '--porcelain'])
		const result = runPrecheck()
		const after = runGit(['status', '--porcelain'])

		expect(result.status).toBe(0)
		expect(after).toBe(before)
	})
})
