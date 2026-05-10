import { snapdom } from "@zumer/snapdom";
import i18n from "../i18n";
import { compressJSON } from "@shared/lib/compression";
import { getLastBoundaryError } from "./error-context";
import { router } from "./router";

// ─── Provider Registry ────────────────────────────────────────────────────────

type ReportDataProvider = () => Promise<Record<string, unknown>>;
const providers: ReportDataProvider[] = [];

/**
 * Register a function that returns app-specific data to include in bug reports.
 * Called at module initialization time (from each app's index.ts).
 */
export function registerReportDataProvider(fn: ReportDataProvider): void {
	providers.push(fn);
}

// ─── Console Interceptor ──────────────────────────────────────────────────────

interface ConsoleEntry {
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

let interceptorStarted = false;
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

// ─── Serializer ───────────────────────────────────────────────────────────────

async function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

async function serializeValue(value: unknown): Promise<unknown> {
	if (value instanceof Blob) return blobToBase64(value);
	if (Array.isArray(value)) return Promise.all(value.map(serializeValue));
	if (value !== null && typeof value === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			result[key] = await serializeValue(val);
		}
		return result;
	}
	return value;
}

// ─── Report Generator ─────────────────────────────────────────────────────────

function formatFilename(): string {
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `fabkit-report-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}.fabreport`;
}

export async function generateBugReport(): Promise<void> {
	const t = (key: string) => i18n.t(key);

	alert(t("bug_report.alert"));

	let screenshot: string | null = null;
	try {
		const capture = await snapdom(document.documentElement, {
			embedFonts: true,
		});
		const blob = await capture.toBlob({ type: "png" });
		screenshot = await blobToBase64(blob);
	} catch {
		// Screenshot failed — continue without it.
	}

	const whatBroke = prompt(t("bug_report.prompt_what_broke"));
	const lastActions = prompt(t("bug_report.prompt_last_actions"));
	const comments = prompt(t("bug_report.prompt_comments"));

	// Collect and serialize data from all registered app providers.
	const rawAppData = await Promise.all(providers.map((fn) => fn()));
	const mergedRaw: Record<string, unknown> = Object.assign({}, ...rawAppData);
	const serializedAppData = await serializeValue(mergedRaw);

	const report = {
		format: "fabreport",
		formatVersion: __APP_VERSION__,
		meta: {
			appVersion: __APP_VERSION__,
			timestamp: new Date().toISOString(),
			url: window.location.href,
			userAgent: navigator.userAgent,
			language: navigator.language,
			screenResolution: `${screen.width}x${screen.height}`,
			viewport: `${window.innerWidth}x${window.innerHeight}`,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			router: {
				location: router.state.location,
				matches: router.state.matches.map((m) => ({
					id: m.id,
					pathname: m.pathname,
					params: m.params,
					search: m.search,
				})),
			},
		},
		user: { whatBroke, lastActions, comments },
		...(serializedAppData as Record<string, unknown>),
		console: [...consoleBuffer],
		screenshot,
		boundaryError: (() => {
			const { error, componentStack } = getLastBoundaryError();
			if (!error) return null;
			return {
				message: error instanceof Error ? error.message : `${error}`,
				stack: error instanceof Error ? error.stack : "",
				componentStack,
			};
		})(),
	};

	const fileBlob = await compressJSON(JSON.stringify(report));
	const url = URL.createObjectURL(fileBlob);
	const a = document.createElement("a");
	a.href = url;
	a.download = formatFilename();
	document.body.appendChild(a);
	console.info("Bug report ready!");
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ─── React Hook ───────────────────────────────────────────────────────────────

export function useBugReport() {
	return { trigger: generateBugReport };
}
