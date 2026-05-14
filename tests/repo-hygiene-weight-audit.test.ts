import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

interface PackageJsonShape {
	overrides?: Record<string, string>
}

const repoRoot = process.cwd()
const minimumSafeProtobuf = '7.5.6'

function readPackageJson(): PackageJsonShape {
	return JSON.parse(
		readFileSync(join(repoRoot, 'package.json'), 'utf8'),
	) as PackageJsonShape
}

function normalizeSemver(version: string): [number, number, number] {
	const match = version.match(/(\d+)\.(\d+)\.(\d+)/)

	if (!match) {
		throw new Error(`Unable to parse semver from: ${version}`)
	}

	return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function isVersionAtLeast(version: string, minimum: string): boolean {
	const current = normalizeSemver(version)
	const baseline = normalizeSemver(minimum)

	for (const [index, value] of current.entries()) {
		if (value > baseline[index]) {
			return true
		}

		if (value < baseline[index]) {
			return false
		}
	}

	return true
}

function readResolvedVersion(packageName: string): string | null {
	const lockfile = readFileSync(join(repoRoot, 'bun.lock'), 'utf8')
	const escapedName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const matcher = new RegExp(`\"${escapedName}@([^\"]+)\"`)
	const match = lockfile.match(matcher)

	return match?.[1] ?? null
}

describe('repo hygiene and weight audit slice', () => {
	it('keeps only the canonical tracked hygiene artifacts', () => {
		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-de-Entidad-Relacion.mmd'),
			),
		).toBe(true)
		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-de-Entidad-Relacion.svg'),
			),
		).toBe(true)
		expect(
			existsSync(
				join(repoRoot, 'postman', 'JumpingPark - Firebase API (Local)'),
			),
		).toBe(true)

		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-de-Entidad-Relación.mmd'),
			),
		).toBe(false)
		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-de-Entidad-Relación.svg'),
			),
		).toBe(false)
		expect(
			existsSync(
				join(
					repoRoot,
					'postman',
					'jumpingpark_collection.postman_collection.json',
				),
			),
		).toBe(false)
		expect(
			existsSync(join(repoRoot, 'ENV_AUDIT_AND_RECOMMENDATIONS.md')),
		).toBe(false)
	})

	it('pins and resolves protobufjs to the safe minimum', () => {
		const packageJson = readPackageJson()
		const override = packageJson.overrides?.protobufjs
		const resolvedVersion = readResolvedVersion('protobufjs')

		expect(typeof override).toBe('string')
		expect(isVersionAtLeast(override ?? '0.0.0', minimumSafeProtobuf)).toBe(
			true,
		)
		expect(resolvedVersion === null).toBe(false)
		expect(
			isVersionAtLeast(resolvedVersion ?? '0.0.0', minimumSafeProtobuf),
		).toBe(true)
	})
})
