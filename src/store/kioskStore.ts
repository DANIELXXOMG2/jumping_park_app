import { create } from "zustand";
import type { UserProfile } from "@/types/firestore";

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
  setStep: (nextStep: number) => void;
  updateVisitorData: (
    payload: Partial<UserProfile>,
    consentPatch?: Partial<ConsentFormState>
  ) => void;
  setAuthenticated: (status: boolean) => void;
  resetFlow: () => void;
}

const createDefaultConsent = (): ConsentFormState => ({
  acceptedPolicy: false,
});

export const useKioskStore = create<KioskState>((set) => ({
  step: 1,
  visitorData: {},
  consent: createDefaultConsent(),
  isAuthenticated: false,
  setStep: (nextStep) => set({ step: nextStep }),
  updateVisitorData: (payload, consentPatch) =>
    set((state) => ({
      visitorData: { ...state.visitorData, ...payload },
      consent: consentPatch
        ? { ...state.consent, ...consentPatch }
        : state.consent,
    })),
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  resetFlow: () =>
    set({
      step: 1,
      visitorData: {},
      consent: createDefaultConsent(),
      isAuthenticated: false,
    }),
}));
