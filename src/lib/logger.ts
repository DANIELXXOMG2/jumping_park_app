type LoggerLevel = "debug" | "info" | "warn" | "error";

const DEBUG_LOG_ENV_KEYS = [
	"APP_DEBUG_LOGS",
	"NEXT_PUBLIC_APP_DEBUG_LOGS",
] as const;

function hasDebugOverride(): boolean {
	return DEBUG_LOG_ENV_KEYS.some((key) => process.env[key] === "true");
}

export function isSafeRuntimeLoggingEnabled(): boolean {
	return process.env.NODE_ENV !== "production" || hasDebugOverride();
}

function shouldEmit(level: LoggerLevel): boolean {
	if (level === "error" || level === "warn") {
		return true;
	}

	return isSafeRuntimeLoggingEnabled();
}

function getConsoleMethod(level: LoggerLevel) {
	if (level === "debug") {
		return console.debug;
	}

	if (level === "info") {
		return console.info;
	}

	if (level === "warn") {
		return console.warn;
	}

	return console.error;
}

function log(
	level: LoggerLevel,
	scope: string,
	message: string,
	meta?: unknown,
) {
	if (!shouldEmit(level)) {
		return;
	}

	const consoleMethod = getConsoleMethod(level);
	const prefix = `[${scope}] ${message}`;

	if (meta === undefined) {
		consoleMethod(prefix);
		return;
	}

	consoleMethod(prefix, meta);
}

export function createLogger(scope: string) {
	return {
		debug: (message: string, meta?: unknown) => {
			log("debug", scope, message, meta);
		},
		info: (message: string, meta?: unknown) => {
			log("info", scope, message, meta);
		},
		warn: (message: string, meta?: unknown) => {
			log("warn", scope, message, meta);
		},
		error: (message: string, meta?: unknown) => {
			log("error", scope, message, meta);
		},
	};
}
