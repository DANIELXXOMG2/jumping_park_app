"use client";

import {
	createContext,
	createElement,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import {
	HARDENING_FLAG,
	HARDENING_FLAG_DEFAULT_ENABLED,
	type KioskHardeningFlags,
	resolveHardeningFlag,
	type HardeningFeatureName,
} from "@/lib/hardeningPolicy";

const DEFAULT_KIOSK_HARDENING_FLAGS: KioskHardeningFlags = {
	offlineQueueEnabled:
		HARDENING_FLAG_DEFAULT_ENABLED[HARDENING_FLAG.OFFLINE_QUEUE],
};

const KioskHardeningContext = createContext<KioskHardeningFlags>(
	DEFAULT_KIOSK_HARDENING_FLAGS,
);

export function KioskHardeningProvider({
	hardeningFlags,
	children,
}: {
	hardeningFlags: KioskHardeningFlags;
	children?: ReactNode;
}) {
	return createElement(
		KioskHardeningContext.Provider,
		{ value: hardeningFlags },
		children,
	);
}

export function useKioskHardeningFlags(): KioskHardeningFlags {
	return useContext(KioskHardeningContext);
}

export function useHydrationSafeHardeningFlag(
	featureName: HardeningFeatureName,
): boolean {
	const { offlineQueueEnabled } = useKioskHardeningFlags();
	const [enabled, setEnabled] = useState(() =>
		featureName === HARDENING_FLAG.OFFLINE_QUEUE ? offlineQueueEnabled : false,
	);

	useEffect(() => {
		if (featureName === HARDENING_FLAG.OFFLINE_QUEUE) {
			setEnabled(offlineQueueEnabled);
			return;
		}

		setEnabled(resolveHardeningFlag(featureName).enabled);
	}, [featureName, offlineQueueEnabled]);

	return enabled;
}
