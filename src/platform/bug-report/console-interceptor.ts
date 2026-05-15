export interface ConsoleEntry {
	level: "error" | "warn" | "info" | "debug" | "unhandled";
	message: string;
	timestamp: number;
	stack?: string;
}

const MAX_BUFFER = 100;
const consoleBuffer: ConsoleEntry[] = [];

function pushEntry(entry: ConsoleEntry): void {
	if (consoleBuffer.length >= MAX_BUFFER) {
		consoleBuffer.shift();
	}
	consoleBuffer.push(entry);
}

export function getConsoleBuffer(): ConsoleEntry[] {
	return [...consoleBuffer];
}

let interceptorStarted = false;

// Must be called before createRoot() in main.tsx to capture early errors.
// Safe to call multiple times — subsequent calls are no-ops.
export function startConsoleInterceptor(): void {
	if (interceptorStarted) return;
	interceptorStarted = true;

	const originalDebug = console.debug.bind(console);
	const originalInfo = console.info.bind(console);
	const originalError = console.error.bind(console);
	const originalWarn = console.warn.bind(console);

	originalInfo("Attaching bug report listener");

	console.error = (...args: unknown[]) => {
		pushEntry({
			level: "error",
			message: args.map(String).join(" "),
			timestamp: Date.now(),
		});
		originalError(...args);
	};
	console.warn = (...args: unknown[]) => {
		pushEntry({
			level: "warn",
			message: args.map(String).join(" "),
			timestamp: Date.now(),
		});
		originalWarn(...args);
	};
	console.info = (...args: unknown[]) => {
		pushEntry({
			level: "info",
			message: args.map(String).join(" "),
			timestamp: Date.now(),
		});
		originalInfo(...args);
	};
	console.debug = (...args: unknown[]) => {
		pushEntry({
			level: "debug",
			message: args.map(String).join(" "),
			timestamp: Date.now(),
		});
		originalDebug(...args);
	};

	window.addEventListener("error", (event) => {
		pushEntry({
			level: "error",
			message: event.message,
			timestamp: Date.now(),
			stack: event.error?.stack,
		});
	});
	window.addEventListener("unhandledrejection", (event) => {
		pushEntry({
			level: "unhandled",
			message: String(event.reason),
			timestamp: Date.now(),
			stack: event.reason?.stack,
		});
	});
}
