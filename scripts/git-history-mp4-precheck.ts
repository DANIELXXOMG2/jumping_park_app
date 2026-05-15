import { execFileSync } from 'node:child_process'

type HistoricalBlob = {
	objectId: string
	path: string
	sizeBytes: number
}

const targetPaths = [
	'public/assets/hero-video.mp4',
	'public/assets/hero-opt.mp4',
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

function readHistoricalBlobs(): HistoricalBlob[] {
	const lines = runGit(['rev-list', '--objects', '--all'])
		.split(/\r?\n/)
		.filter(Boolean)

	const blobs: HistoricalBlob[] = []

	for (const line of lines) {
		const separatorIndex = line.indexOf(' ')

		if (separatorIndex === -1) {
			continue
		}

		const objectId = line.slice(0, separatorIndex)
		const objectPath = line.slice(separatorIndex + 1)

		if (!targetPaths.includes(objectPath as (typeof targetPaths)[number])) {
			continue
		}

		const sizeBytes = Number(runGit(['cat-file', '-s', objectId]))

		blobs.push({
			objectId,
			path: objectPath,
			sizeBytes,
		})
	}

	return blobs.sort((left, right) => right.sizeBytes - left.sizeBytes)
}

function main() {
	const blobs = readHistoricalBlobs()
	const packStats = runGit(['count-objects', '-vH'])

	console.log('Git history MP4 purge precheck')
	console.log('================================')
	console.log(`Repository: ${process.cwd()}`)
	console.log(`Targets found: ${blobs.length}`)

	for (const blob of blobs) {
		console.log(
			`- ${blob.path} | ${blob.objectId} | ${blob.sizeBytes} bytes (${formatMiB(blob.sizeBytes)})`,
		)
	}

	if (blobs.length === 0) {
		console.log('- No tracked historical MP4 blobs matched the configured target paths.')
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
