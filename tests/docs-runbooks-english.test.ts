import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

const activeRunbooks = [
	{
		path: 'docs/runbooks/admin-cost-smoke-checklist.md',
		englishAnchor:
			'The goal of this checklist is to prove the admin really stays on the cheaper plane: cursors and aggregates, not growing scans.',
		legacySpanishPhrase:
			'El objetivo de este checklist es verificar que el admin realmente esta operando sobre el plano barato: cursores y agregados, no scans crecientes.',
	},
	{
		path: 'docs/runbooks/dependency-risk-note.md',
		englishAnchor: '## Current status',
		legacySpanishPhrase: '## Estado actual',
	},
	{
		path: 'docs/runbooks/offline-replay-drill.md',
		englishAnchor:
			'This drill tests the kiosk\'s most delicate promise: accept a consent without network access, then replay it without duplicating the sequence or creating two consents.',
		legacySpanishPhrase:
			'Este drill prueba la promesa mas delicada del kiosk: aceptar un consentimiento sin red y reintentar sin duplicar el consecutivo ni crear dos consentimientos.',
	},
	{
		path: 'docs/runbooks/production-hardening.md',
		englishAnchor:
			'This document is the operational entry point. If you need to validate, enable, or roll back a roadmap capability, start here and then move to the specialized runbook.',
		legacySpanishPhrase:
			'Este documento es la puerta de entrada operativa. Si vas a validar, habilitar o revertir una capacidad del roadmap, arrancas aca y despues seguis el runbook especializado.',
	},
	{
		path: 'docs/runbooks/rollback-flags.md',
		englishAnchor:
			'This runbook defines how to roll back the shipped capabilities quickly without touching production data.',
		legacySpanishPhrase:
			'Este runbook define como revertir rapido las capacidades agregadas sin tocar datos productivos.',
	},
	{
		path: 'docs/runbooks/seo-ai-seo-validation-checklist.md',
		englishAnchor:
			'This checklist combines three things that MUST coexist: real indexability, agent clarity, and a minimum manual accessibility validation for the public surface.',
		legacySpanishPhrase:
			'Este checklist mezcla tres cosas que TIENEN que convivir: indexabilidad real, claridad para agentes, y una validacion manual minima de accesibilidad de la superficie publica.',
	},
	{
		path: 'docs/runbooks/otp-operational-policy.md',
		englishAnchor:
			'This runbook documents the OTP operational behavior currently enforced by the kiosk flow so operators can troubleshoot incidents without guessing.',
		legacySpanishPhrase: undefined,
	},
	{
		path: 'docs/runbooks/git-history-mp4-purge.md',
		englishAnchor:
			'This runbook documents the safe, coordinated path for removing the final recommended purge set from Git history.',
		legacySpanishPhrase: undefined,
	},
] as const

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('active runbooks stay on English canon', () => {
	it('keeps the current runbook filenames stable', () => {
		expect(
			activeRunbooks.filter(({ path }) => !existsSync(join(projectRoot, path))),
		).toEqual([])
	})

	it('replaces the legacy Spanish body copy with English operational guidance', () => {
		for (const { path, englishAnchor, legacySpanishPhrase } of activeRunbooks) {
			const content = readProjectFile(path)

			expect(content).toContain(englishAnchor)

			if (legacySpanishPhrase) {
				expect(content).not.toContain(legacySpanishPhrase)
			}
		}
	})
})
