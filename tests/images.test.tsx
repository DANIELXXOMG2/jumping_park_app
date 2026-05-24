import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

const { default: ConsentimientoDigitalPage } = await import(
	'@/app/(public)/consentimiento-digital/page',
)
const { default: nextConfig } = await import('../next.config')
const {
	IMAGE_ASSET_PATHS,
	NEXT_IMAGE_FORMATS,
	NEXT_IMAGE_QUALITIES,
	OPTIMIZABLE_IMAGE_ASSETS,
	PAGE_IMAGE_VARIANTS,
	PUBLIC_IMAGE_SIZES,
} = await import('@/lib/imageOptimization')

const repoRoot = process.cwd()
const maxOptimizedImageBytes = 150_000

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function hasStringScripts(
	value: unknown,
): value is { scripts: Record<string, string> } {
	if (!isRecord(value) || !isRecord(value.scripts)) {
		return false
	}

	return Object.values(value.scripts).every(
		(script) => typeof script === 'string',
	)
}

function readPackageScripts(): Record<string, string> {
	const packageJson: unknown = JSON.parse(
		readFileSync(join(repoRoot, 'package.json'), 'utf8'),
	)

	return hasStringScripts(packageJson) ? packageJson.scripts : {}
}

function getPublicAssetPath(assetPath: string): string {
	return join(repoRoot, 'public', assetPath.replace(/^\//, ''))
}

describe('image optimization phase', () => {
	it('configures next image formats with a quality floor and exposes the optimize:images workflow', () => {
		const packageScripts = readPackageScripts()
		const imageConfig = nextConfig.images
		const configuredQualities = imageConfig?.qualities ?? []

		expect(imageConfig?.formats).toEqual([...NEXT_IMAGE_FORMATS])
		expect(configuredQualities).toEqual([...NEXT_IMAGE_QUALITIES])
		expect(configuredQualities.every((quality) => quality >= 80)).toBe(true)
		expect(
			OPTIMIZABLE_IMAGE_ASSETS.every((asset) =>
				configuredQualities.includes(asset.quality),
			),
		).toBe(true)
		expect(packageScripts['optimize:images']).toBe(
			'bun run scripts/optimize-images.ts',
		)
		expect(existsSync(join(repoRoot, 'scripts', 'optimize-images.ts'))).toBe(true)
	})

	it('keeps the original PNG sources while shipping smaller WebP derivatives for the heavy assets', () => {
		const astronautSource = getPublicAssetPath(IMAGE_ASSET_PATHS.astronautSourcePng)
		const astronautOptimized = getPublicAssetPath(
			IMAGE_ASSET_PATHS.astronautOptimizedWebp,
		)
		const logoSource = getPublicAssetPath(IMAGE_ASSET_PATHS.logoSourcePng)
		const logoOptimized = getPublicAssetPath(IMAGE_ASSET_PATHS.logoOptimizedWebp)

		expect(existsSync(astronautSource)).toBe(true)
		expect(existsSync(logoSource)).toBe(true)
		expect(existsSync(astronautOptimized)).toBe(true)
		expect(existsSync(logoOptimized)).toBe(true)
		expect(statSync(astronautOptimized).size <= maxOptimizedImageBytes).toBe(
			true,
		)
		expect(statSync(logoOptimized).size <= maxOptimizedImageBytes).toBe(true)
		expect(statSync(astronautOptimized).size < statSync(astronautSource).size).toBe(
			true,
		)
		expect(statSync(logoOptimized).size < statSync(logoSource).size).toBe(true)
	})

	it('publishes optimized asset variants for the landing surfaces that consume these images', () => {
		expect(PAGE_IMAGE_VARIANTS.publicConsentLogo.src).toBe(
			IMAGE_ASSET_PATHS.logoOptimizedWebp,
		)
		expect(PAGE_IMAGE_VARIANTS.kioskAstronaut.src).toBe(
			IMAGE_ASSET_PATHS.astronautOptimizedWebp,
		)
		expect(PAGE_IMAGE_VARIANTS.publicConsentLogo.sizes).toBe(
			PUBLIC_IMAGE_SIZES.publicConsentLogo,
		)
	})

	it('renders responsive next/image markup for the consentimiento digital public page', () => {
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />)

		expect(markup).toContain('jumping-park-logo.webp')
		expect(markup).toContain(
			`sizes=\"${PUBLIC_IMAGE_SIZES.publicConsentLogo}\"`,
		)
		expect(markup).toContain('srcSet=')
	})
})
