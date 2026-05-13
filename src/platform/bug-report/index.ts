// TODO(phase-6): boundary violation — platform importing from app. Will be resolved when bug-report is fully decoupled.
import { AllRenderConfigVariations } from "@fabkit/apps/card-creator/config/rendering";
// TODO(phase-6): boundary violation — platform importing from app. Will be resolved when bug-report is fully decoupled.
import {
	blobToBase64,
	exportCardToObject,
	type FabgalleryFile,
	getAllCards,
} from "@fabkit/apps/card-creator/persistence/card-storage";
import { compressJSON } from "@fabkit/shared/lib/compression";
import { snapdom } from "@zumer/snapdom";
import i18n from "../../i18n";
import { getLastBoundaryError } from "../error-context";
import { router } from "../router";
import { getConsoleBuffer } from "./console-interceptor";
import { collectAppData } from "./provider-registry";

export { startConsoleInterceptor } from "./console-interceptor";
export {
	type ReportDataProvider,
	registerReportDataProvider,
} from "./provider-registry";

// ─── Serializer ───────────────────────────────────────────────────────────────

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

export async function generateBugReport(): Promise<void> {
	const t = (key: string) => i18n.t(key);

	alert(t("bug_report.alert"));

	// Screenshot first — page must be in its current (broken) state.
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

	const whatBroke = prompt(t("bug_report.prompt_what_broke"));
	const lastActions = prompt(t("bug_report.prompt_last_actions"));
	const comments = prompt(t("bug_report.prompt_comments"));

	const appData = collectAppData();

	// Best-effort: read card-creator renderer info if that provider is registered.
	const ccState = appData["card-creator"] as
		| { CardBack?: { renderer?: string } }
		| undefined;

	const gallery = await getAllCards().catch(() => []);

	const [serializedApps, serializedCards] = await Promise.all([
		serializeValue(appData),
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
			cardBackRenderer: ccState?.CardBack?.renderer ?? null,
			resolvedConfig: ccState?.CardBack?.renderer
				? (AllRenderConfigVariations[ccState.CardBack.renderer] ?? null)
				: null,
		},
		apps: serializedApps,
		gallery: serializedGallery,
		console: getConsoleBuffer(),
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
