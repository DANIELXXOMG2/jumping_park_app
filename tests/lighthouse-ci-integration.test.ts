import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

interface PackageJsonShape {
	devDependencies?: Record<string, string>
}

interface LighthouseCiConfig {
	ci?: {
		collect?: {
			numberOfRuns?: number
			startServerCommand?: string
			startServerReadyPattern?: string
			url?: string[]
		}
		assert?: {
			assertions?: Record<
				string,
				[string, { minScore?: number }] | string
			>
		}
		upload?: {
			target?: string
		}
	}
}

const repoRoot = process.cwd()

function readPackageJson(): PackageJsonShape {
	return JSON.parse(
		readFileSync(join(repoRoot, 'package.json'), 'utf8'),
	) as PackageJsonShape
}

function readLighthouseConfig(): LighthouseCiConfig {
	return JSON.parse(
		readFileSync(join(repoRoot, 'lighthouserc.json'), 'utf8'),
	) as LighthouseCiConfig
}

function readWorkflowFile(): string {
	return readFileSync(
		join(repoRoot, '.github', 'workflows', 'lighthouse.yml'),
		'utf8',
	)
}

describe('lighthouse ci integration slice', () => {
	it('adds lighthouse ci as a tracked dev dependency', () => {
		const packageJson = readPackageJson()
		const lhciVersion = packageJson.devDependencies?.['@lhci/cli']

		expect(typeof lhciVersion).toBe('string')
		expect((lhciVersion ?? '').length > 0).toBe(true)
	})

	it('stores lighthouse ci collection defaults for pull request audits', () => {
		expect(existsSync(join(repoRoot, 'lighthouserc.json'))).toBe(true)

		const config = readLighthouseConfig()

		expect(config.ci?.collect?.numberOfRuns).toBe(3)
		expect(config.ci?.collect?.startServerCommand).toBe(
			'bun run start -- --hostname 127.0.0.1 --port 3000',
		)
		expect(config.ci?.collect?.startServerReadyPattern).toBe('Ready in')
		expect(config.ci?.collect?.url).toEqual(['http://127.0.0.1:3000/'])
		expect(config.ci?.upload?.target).toBe('temporary-public-storage')
	})

	it('enforces the agreed lighthouse category score thresholds', () => {
		const assertions = readLighthouseConfig().ci?.assert?.assertions

		expect(assertions?.['categories:performance']).toEqual([
			'error',
			{ minScore: 0.8 },
		])
		expect(assertions?.['categories:accessibility']).toEqual([
			'error',
			{ minScore: 0.9 },
		])
		expect(assertions?.['categories:best-practices']).toEqual([
			'error',
			{ minScore: 0.9 },
		])
		expect(assertions?.['categories:seo']).toEqual([
			'error',
			{ minScore: 0.9 },
		])
	})

	it('adds a pull-request workflow that builds the app and runs lhci autorun', () => {
		expect(
			existsSync(join(repoRoot, '.github', 'workflows', 'lighthouse.yml')),
		).toBe(true)

		const workflow = readWorkflowFile()

		expect(workflow.includes('name: Lighthouse CI')).toBe(true)
		expect(workflow.includes('pull_request:')).toBe(true)
		expect(workflow.includes('uses: oven-sh/setup-bun@v2')).toBe(true)
		expect(workflow.includes('run: bun install --frozen-lockfile')).toBe(true)
		expect(workflow.includes('run: bun run build')).toBe(true)
		expect(
			workflow.includes(
				'run: bun x lhci autorun --config=./lighthouserc.json',
			),
		).toBe(true)
	})

	it('keeps the lighthouse workflow review-friendly and inspectable', () => {
		const workflow = readWorkflowFile()

		expect(workflow.includes('timeout-minutes: 20')).toBe(true)
		expect(
			workflow.includes('name: Upload Lighthouse reports artifact'),
		).toBe(true)
		expect(workflow.includes('path: .lighthouseci')).toBe(true)
	})
})
