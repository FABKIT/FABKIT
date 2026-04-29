import { snapdom } from "@zumer/snapdom";
import { AllRenderConfigVariations } from "../config/rendering";
import i18n from "../i18n";
import { router } from "../main";
import {
	blobToBase64,
	exportCardToObject,
	type FabgalleryFile,
	getAllCards,
} from "../persistence/card-storage";
import { useCardCreator } from "../stores/card-creator";
import { getLastBoundaryError } from "./error-context";

// ─── Console Interceptor ──────────────────────────────────────────────────────

interface ConsoleEntry {
	level: "error" | "warn" | "unhandled";
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

/**
 * Sets up console.error/warn overrides and window error listeners.
 * Must be called before createRoot() in main.tsx to capture early errors.
 * Safe to call multiple times — subsequent calls are no-ops due to the guard.
 */
let interceptorStarted = false;
export function startConsoleInterceptor(): void {
	if (interceptorStarted) return;
	interceptorStarted = true;

	const originalError = console.error.bind(console);
	const originalWarn = console.warn.bind(console);

	console.info("Attaching bug report listener");
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

/**
 * Recursively walks an object graph, converting any Blob instances to base64
 * data URLs. Arrays and plain objects are traversed; everything else is
 * returned as-is. Functions are passed through and will be stripped by
 * JSON.stringify at the call site.
 */
async function serializeValue(value: unknown): Promise<unknown> {
	if (value instanceof Blob) {
		return blobToBase64(value);
	}
	if (Array.isArray(value)) {
		return Promise.all(value.map(serializeValue));
	}
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

/**
 * Runs the full bug report flow:
 * 1. Alert with privacy notice
 * 2. Full-page screenshot (before any prompts change the page)
 * 3. Collect user description via prompts
 * 4. Serialize store + gallery + runtime metadata
 * 5. Download .fabreport file
 *
 * Returns early without downloading if the user cancels a required prompt.
 */
export async function generateBugReport(): Promise<void> {
	const t = (key: string) => i18n.t(key);

	alert(t("bug_report.alert"));

	// Screenshot first — page must be in its current (broken) state.
	// Any UI change before this point would corrupt the screenshot.
	let screenshot: string | null = null;
	try {
		const capture = await snapdom(document.documentElement, {
			embedFonts: true,
		});
		const blob = await capture.toBlob({ type: "png" });
		screenshot = await blobToBase64(blob);
	} catch {
		// Screenshot failed (e.g. canvas taint). Continue with null.
	}

	// Required fields — cancel aborts the whole report.
	const whatBroke = prompt(t("bug_report.prompt_what_broke"));

	const lastActions = prompt(t("bug_report.prompt_last_actions"));

	// Optional field — cancel is treated as "no comment".
	const comments = prompt(t("bug_report.prompt_comments"));

	// Collect state. getAllCards() is best-effort — if IndexedDB is broken, we
	// still produce a useful report without gallery contents.
	const storeState = useCardCreator.getState();
	const gallery = await getAllCards().catch(() => []);

	const [serializedStore, serializedCards] = await Promise.all([
		serializeValue(storeState),
		Promise.all(gallery.map(exportCardToObject)),
	]);

	const serializedGallery: FabgalleryFile = {
		format: "fabgallery",
		formatVersion: __APP_VERSION__,
		exportedAt: new Date().toISOString(),
		cardCount: serializedCards.length,
		cards: serializedCards,
	};

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
		user: {
			whatBroke,
			lastActions,
			comments,
		},
		rendering: {
			cardBackRenderer: storeState.CardBack?.renderer ?? null,
			resolvedConfig: storeState.CardBack
				? (AllRenderConfigVariations[storeState.CardBack.renderer] ?? null)
				: null,
		},
		store: serializedStore,
		gallery: serializedGallery,
		console: [...consoleBuffer],
		screenshot,
		boundaryError: (() => {
			const { error, componentStack } = getLastBoundaryError();
			if (!error) return null;
			return {
				message: error instanceof Error ? error.message : `${error} `,
				stack: error instanceof Error ? error.stack : "",
				componentStack,
			};
		})(),
	};

	const fileBlob = new Blob([JSON.stringify(report)], {
		type: "application/json",
	});
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

/**
 * Thin hook for triggering bug report generation from a React component.
 * Returns only `trigger` — no loading state, to avoid UI changes before
 * the screenshot is taken.
 */
export function useBugReport() {
	return { trigger: generateBugReport };
}
