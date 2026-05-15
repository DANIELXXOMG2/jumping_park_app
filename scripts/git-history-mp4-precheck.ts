import { execFileSync } from 'node:child_process'

type HistoricalCandidateObject = {
	objectId: string
	path: string
	sizeBytes: number
}

const purgeCandidatePaths = [
	'public/assets/hero-video.mp4',
	'public/assets/hero-opt.mp4',
	'package-lock.json',
	'diagramas/Diagrama-Secuencia.svg',
	'diagramas/Diagrama-de-Entidad-Relacion.svg',
] as const

function runGit(args: string[]): string {
	return execFileSync('git', args, {
		cwd: process.cwd(),
		encoding: 'utf8',
	}).trimEnd()
}

function formatMiB(sizeBytes: number): string {
	return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MiB`
}

function readHistoricalObjects(): HistoricalCandidateObject[] {
	const lines = runGit(['rev-list', '--objects', '--all'])
		.split(/\r?\n/)
		.filter(Boolean)

	const objects: HistoricalCandidateObject[] = []

	for (const line of lines) {
		const separatorIndex = line.indexOf(' ')

		if (separatorIndex === -1) {
			continue
		}

		const objectId = line.slice(0, separatorIndex)
		const objectPath = line.slice(separatorIndex + 1)

		if (
			!purgeCandidatePaths.includes(
				objectPath as (typeof purgeCandidatePaths)[number],
			)
		) {
			continue
		}

		const sizeBytes = Number(runGit(['cat-file', '-s', objectId]))

		objects.push({
			objectId,
			path: objectPath,
			sizeBytes,
		})
	}

	return objects.sort((left, right) => right.sizeBytes - left.sizeBytes)
}

function main() {
	const objects = readHistoricalObjects()
	const packStats = runGit(['count-objects', '-vH'])

	console.log('Git history targeted purge precheck')
	console.log('================================')
	console.log(`Repository: ${process.cwd()}`)
	console.log(`Configured purge candidate paths: ${purgeCandidatePaths.length}`)
	console.log('Configured paths:')

	for (const candidatePath of purgeCandidatePaths) {
		console.log(`- ${candidatePath}`)
	}

	console.log(`Historical objects found: ${objects.length}`)

	for (const object of objects) {
		console.log(
			`- ${object.path} | ${object.objectId} | ${object.sizeBytes} bytes (${formatMiB(object.sizeBytes)})`,
		)
	}

	if (objects.length === 0) {
		console.log(
			'- No tracked historical objects matched the configured purge candidate paths.',
		)
	}

	console.log('')
	console.log('Current git object storage:')
	console.log(packStats)
	console.log('')
	console.log('No history rewrite was executed.')
	console.log(
		'Next step: review docs/runbooks/git-history-mp4-purge.md before executing git filter-repo in a fresh clone.',
	)
}

main()
