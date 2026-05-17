import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('API reference stays truthful', () => {
	it('publishes an English API map with explicit boundary notes', () => {
		const apiReadme = readProjectFile('docs/api/README.md')

		expect(apiReadme).toContain('# API reference')
		expect(apiReadme).toContain(
			'This reference is the current manual map of the API surface for Jumping Park.',
		)
		expect(apiReadme).toContain('## Quick path')
		expect(apiReadme).toContain('## Current boundary')
		expect(apiReadme).toContain('## Service layer')
		expect(apiReadme).toContain('## Shared validation surface')
		expect(apiReadme).toContain('## Main route surface')
		expect(apiReadme).toContain('No generated OpenAPI document ships with this repository today.')
	})

	it('tracks every current service file, the main route/schema surface, and the docs index entrypoint', () => {
		const apiReadme = readProjectFile('docs/api/README.md')
		const docsIndex = readProjectFile('docs/README.md')
		const serviceFiles = readdirSync(join(projectRoot, 'src/services'))
			.filter((file) => file.endsWith('.ts'))
			.sort()

		expect(serviceFiles.length).toBe(13)

		for (const serviceFile of serviceFiles) {
			expect(apiReadme).toContain(`\`src/services/${serviceFile}\``)
		}

		const routePaths = [
			'POST /api/otp',
			'POST /api/otp/validate',
			'POST /api/consentimientos',
			'GET /api/settings/consent',
			'GET /api/usuarios',
			'POST /api/usuarios',
			'POST /api/usuarios/check',
			'GET /api/usuarios/[uid]/menores',
			'GET /api/menores',
			'POST /api/menores',
			'GET /api/accesos',
			'POST /api/accesos',
			'/api/admin/session',
			'/api/admin/verificar-consentimiento',
			'/api/admin/users',
			'/api/admin/staff',
			'/api/admin/minors',
			'/api/admin/consents',
			'/api/admin/export/users',
			'/api/admin/export/consents',
			'/api/admin/stats',
			'/api/admin/stats/detailed',
			'/api/admin/activity',
			'/api/admin/settings/consent',
			'/api/admin/roles',
			'/api/admin/set-admin',
			'/api/admin/migrate/minors',
		]

		for (const routePath of routePaths) {
			expect(apiReadme).toContain(routePath)
		}

		const schemaNames = [
			'sendOtpSchema',
			'validateOtpSchema',
			'accesoCreateSchema',
			'menorCreateSchema',
			'usuarioCreateSchema',
			'consentSubmissionSchema',
			'minorSchema',
			'localizedConsentSchema',
			'visitorSchema',
		]

		for (const schemaName of schemaNames) {
			expect(apiReadme).toContain(`\`${schemaName}\``)
		}

		const [, plannedSection = ''] = docsIndex.split('## Planned next slices')

		expect(docsIndex).toContain('| `docs/api/` | Service and schema reference for the API surface and shared Zod contracts. | Active |')
		expect(plannedSection).not.toContain('`docs/api/`')
	})
})
