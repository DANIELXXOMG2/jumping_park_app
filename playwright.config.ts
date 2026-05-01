import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
	testDir: './playwright',
	testMatch: '**/*.a11y.ts',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [['list']],
	use: {
		baseURL,
		trace: 'retain-on-failure',
		headless: true,
		viewport: { width: 1280, height: 900 },
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: `bun dev -p ${PORT} -H 127.0.0.1`,
		url: baseURL,
		reuseExistingServer: true,
		timeout: 120000,
		env: {
			...process.env,
			NODE_ENV: 'development',
			OFFLINE_QUEUE_ENABLED: 'true',
			NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED: 'true',
			CURSOR_PAGINATION_ENABLED: 'true',
			ADMIN_AGGREGATES_ENABLED: 'true',
			FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? 'demo-project',
			FIREBASE_CLIENT_EMAIL:
				process.env.FIREBASE_CLIENT_EMAIL ?? 'demo-admin@jumpingpark.test',
			FIREBASE_PRIVATE_KEY:
				process.env.FIREBASE_PRIVATE_KEY ?? '',
			FIREBASE_STORAGE_BUCKET:
				process.env.FIREBASE_STORAGE_BUCKET ?? 'demo-project.firebasestorage.app',
			NEXT_PUBLIC_FIREBASE_API_KEY:
				process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
			NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
				process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo-project.firebaseapp.com',
			NEXT_PUBLIC_FIREBASE_PROJECT_ID:
				process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-project',
			NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
				process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-project.firebasestorage.app',
			NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
				process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '1234567890',
			NEXT_PUBLIC_FIREBASE_APP_ID:
				process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:1234567890:web:demo',
		},
	},
})
