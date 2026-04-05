import admin from 'firebase-admin'

if (!admin.apps.length) {
	const projectId = process.env.FIREBASE_PROJECT_ID as string | undefined
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string | undefined
	const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY as string | undefined
	const privateKey = privateKeyRaw
		? privateKeyRaw.replace(/\\n/g, '\n')
		: undefined
	const storageBucket = process.env.FIREBASE_STORAGE_BUCKET
	const appOptions: admin.AppOptions = {}

	if (storageBucket) {
		appOptions.storageBucket = storageBucket
	}

	if (projectId && clientEmail && privateKey) {
		appOptions.credential = admin.credential.cert({
			projectId,
			clientEmail,
			privateKey,
		})
	}

	if (!projectId || !clientEmail || !privateKey) {
		console.warn(
			'FIREBASE env vars incomplete. Provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to enable Admin SDK.',
		)
	}

	try {
		admin.initializeApp(appOptions)
	} catch (err) {
		console.error('Error initializing firebase-admin:', err)
	}
}

const db = admin.firestore()
const bucket = process.env.FIREBASE_STORAGE_BUCKET
	? admin.storage().bucket()
	: undefined
const adminAuth = admin.auth()

export { admin, db, bucket, adminAuth }
