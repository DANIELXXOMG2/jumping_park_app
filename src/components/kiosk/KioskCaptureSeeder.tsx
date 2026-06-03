/**
 * Kiosk capture seeder.
 *
 * Opt-in client component used ONLY by the screenshot capture pipeline to
 * hydrate the kiosk store before a still is taken. When the Playwright
 * harness navigates to a kiosk route with `?captureSeed=<base64>`, the
 * seeder decodes the payload and seeds the store so the page renders its
 * truthful input state (e.g. the OTP page shows the masked email, the
 * consentimiento page shows the form instead of redirecting to /ingreso).
 *
 * In production usage the param is absent and the seeder is a no-op. The
 * component never mutates anything without a valid seed and never touches
 * localStorage from a real user path.
 *
 * Ordering contract: this component MUST be rendered before
 * `<KioskSessionRestorer />` in the kiosk layout so its layout effect
 * hydrates `isAuthenticated = true` (and `visitorData`) before the
 * restorer checks them; otherwise the restorer hits its
 * "protected route without session" branch and redirects the capture to
 * `/` before the store is seeded.
 */
"use client";

import { useLayoutEffect } from "react";
import {
	captureSeedPayloadSchema,
	type CaptureSeedPayload,
} from "@/lib/schemas/screenshotCapture.schema";
import { useKioskStore } from "@/store/kioskStore";

const ALLOW_CAPTURE_SEED = process.env.NODE_ENV !== "production";

/**
 * Pure decoder: base64-encoded JSON -> DecodedCaptureSeed | null.
 *
 * Rejects null / empty / whitespace / non-base64 / non-JSON input, and any
 * payload whose top-level fields are missing or not strings. The contract
 * is: garbage in -> null out. The caller decides what to do with null
 * (the seeder simply treats it as "no seed present").
 */
export function decodeCaptureSeed(
	raw: string | null,
): CaptureSeedPayload | null {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;

	let jsonString: string;
	try {
		jsonString = atob(trimmed);
	} catch {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonString);
	} catch {
		return null;
	}

	const validated = captureSeedPayloadSchema.safeParse(parsed);
	if (!validated.success) return null;

	return validated.data;
}

/**
 * Opt-in capture seeder. Mounts no visible UI; on first render it reads
 * `?captureSeed=` from `window.location.search`, decodes it, and pushes
 * the result into the kiosk store. Uses `useLayoutEffect` so the seed is
 * in place synchronously before any child layout effects or the
 * restorer's mount-time redirect check runs.
 */
export function KioskCaptureSeeder(): null {
	useLayoutEffect(() => {
		if (!ALLOW_CAPTURE_SEED) return;
		if (typeof window === "undefined") return;

		const params = new URLSearchParams(window.location.search);
		const raw = params.get("captureSeed");
		const decoded = decodeCaptureSeed(raw);
		if (!decoded) return;
		const pathname = window.location.pathname;

		const store = useKioskStore.getState();
		// visitorData first so persistSession() inside setAuthenticated(true)
		// sees a valid uid and keeps the (transient) session coherent.
		store.updateVisitorData({
			uid: decoded.uid,
			email: decoded.email,
			fullName: decoded.fullName,
		});
		// Only protected capture routes need an authenticated session. OTP is a
		// public route; marking it authenticated would make
		// `KioskSessionRestorer` redirect the capture to /consentimiento.
		if (pathname === "/consentimiento") {
			store.setAuthenticated(true);
		}
	}, []);

	return null;
}
