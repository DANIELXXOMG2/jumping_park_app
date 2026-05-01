import { create } from "zustand";
import {
	clearKioskSession,
	getKioskSession,
	saveKioskSession,
} from "@/lib/utils/kioskSession";
import type { UserProfile } from "@/types/firestore";

export interface KioskOfflineRuntimeState {
	enabled: boolean;
	isOnline: boolean;
	shellReady: boolean;
	queueSize: number;
	isSyncing: boolean;
	lastSyncAt?: string;
	lastSyncError?: string;
	lastRejectedAt?: string;
	lastRejectedError?: string;
}

export interface ConsentFormState {
	acceptedPolicy: boolean;
	signatureData?: string;
	policyVersion?: string;
	signedAt?: Date;
}

interface KioskState {
	step: number;
	visitorData: Partial<UserProfile>;
	consent: ConsentFormState;
	isAuthenticated: boolean;
	/** Indica si la sesión fue restaurada desde localStorage */
	wasRestored: boolean;
	offline: KioskOfflineRuntimeState;
	setStep: (nextStep: number) => void;
	updateVisitorData: (
		payload: Partial<UserProfile>,
		consentPatch?: Partial<ConsentFormState>,
	) => void;
	setAuthenticated: (status: boolean) => void;
	resetFlow: () => void;
	/** Intenta restaurar la sesión desde localStorage */
	restoreSession: () => boolean;
	/** Persiste el estado actual en localStorage */
	persistSession: () => void;
	/** Limpia la sesión (localStorage + estado) - usar al finalizar */
	clearSession: () => void;
	setOfflineRuntime: (patch: Partial<KioskOfflineRuntimeState>) => void;
}

const createDefaultConsent = (): ConsentFormState => ({
	acceptedPolicy: false,
});

const createDefaultOfflineRuntime = (): KioskOfflineRuntimeState => ({
	enabled: false,
	isOnline: true,
	shellReady: false,
	queueSize: 0,
	isSyncing: false,
});

export const useKioskStore = create<KioskState>((set, get) => ({
	step: 1,
	visitorData: {},
	consent: createDefaultConsent(),
	isAuthenticated: false,
	wasRestored: false,
	offline: createDefaultOfflineRuntime(),

	setStep: (nextStep) => {
		set({ step: nextStep });
		// Persistir después de cambiar de paso
		get().persistSession();
	},

	updateVisitorData: (payload, consentPatch) => {
		set((state) => ({
			visitorData: { ...state.visitorData, ...payload },
			consent: consentPatch
				? { ...state.consent, ...consentPatch }
				: state.consent,
		}));
		// Persistir después de actualizar datos
		get().persistSession();
	},

	setAuthenticated: (status) => {
		set({ isAuthenticated: status });
		// Persistir después de autenticación (OTP válido)
		if (status) {
			get().persistSession();
		}
	},

	resetFlow: () =>
		set({
			step: 1,
			visitorData: {},
			consent: createDefaultConsent(),
			isAuthenticated: false,
			wasRestored: false,
		}),

	restoreSession: () => {
		const session = getKioskSession();
		if (session?.isAuthenticated) {
			set({
				step: session.step,
				visitorData: session.visitorData,
				consent: session.consent,
				isAuthenticated: session.isAuthenticated,
				wasRestored: true,
			});
			return true;
		}
		return false;
	},

	persistSession: () => {
		const state = get();
		// Solo persistir si hay datos de visitante con uid
		const uid = state.visitorData.uid;
		if (uid && state.isAuthenticated) {
			saveKioskSession({
				uid,
				visitorData: state.visitorData,
				consent: state.consent,
				step: state.step,
				isAuthenticated: state.isAuthenticated,
			});
		}
	},

	clearSession: () => {
		// Limpiar localStorage
		clearKioskSession();
		// Resetear estado
		set({
			step: 1,
			visitorData: {},
			consent: createDefaultConsent(),
			isAuthenticated: false,
			wasRestored: false,
		});
	},

	setOfflineRuntime: (patch) =>
		set((state) => ({
			offline: { ...state.offline, ...patch },
		})),
}));
