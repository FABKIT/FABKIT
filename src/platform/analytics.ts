/**
 * Provider-agnostic analytics wrapper. Call sites only ever see `trackEvent()`
 * with a typed event — the active provider (currently Umami) can be swapped
 * for something else (e.g. Clarity) by changing `activeProvider` below,
 * without touching a single call site.
 *
 * Only active on real production builds (`MODE === "production"`, i.e. the
 * FABKIT/FABKIT release build — not `bun dev`, not fork/staging builds) and
 * only when a website id is configured. Everywhere else `trackEvent` is a
 * no-op, so call sites never need to guard themselves.
 */

interface AnalyticsProvider {
	init(): void;
	track(name: string, data?: Record<string, string | number | boolean>): void;
}

const UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";
const UMAMI_TRACKED_DOMAIN = "fabkit.io";

function createUmamiProvider(websiteId: string): AnalyticsProvider {
	return {
		init() {
			const script = document.createElement("script");
			script.defer = true;
			script.src = UMAMI_SCRIPT_URL;
			script.dataset.websiteId = websiteId;
			script.dataset.domains = UMAMI_TRACKED_DOMAIN;
			document.head.appendChild(script);
		},
		track(name, data) {
			window.umami?.track(name, data);
		},
	};
}

const noopProvider: AnalyticsProvider = {
	init() {},
	track() {},
};

const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
const activeProvider: AnalyticsProvider =
	import.meta.env.MODE === "production" && websiteId
		? createUmamiProvider(websiteId)
		: noopProvider;

/** Call once, at app startup. */
export function initAnalytics(): void {
	activeProvider.init();
}

// ─── Event catalog ──────────────────────────────────────────────────────────
// Every event FABKIT tracks lives here, typed. No PII, no user-entered text
// (card names, bug report contents, etc.), no Fabble `answerId` — see
// `src/apps/fabble/CLAUDE.md`'s bug-report redaction for why that last one
// matters (an event payload can spoil an in-progress puzzle same as a report
// can).

type AnalyticsEvent =
	| { name: "card_type_selected"; data: { cardType: string } }
	| {
			name: "card_exported";
			data: { cardType: string; orientation: "portrait" | "landscape" };
	  }
	| { name: "preset_link_created"; data: { cardType: string } }
	| { name: "preset_link_opened"; data: { cardType: string } }
	| { name: "gallery_exported" }
	| { name: "gallery_folder_created" }
	| { name: "fabble_puzzle_started"; data: { mode: string } }
	| {
			name: "fabble_guess_submitted";
			data: { mode: string; guessNumber: number; correct: boolean };
	  }
	| { name: "fabble_hint_revealed"; data: { mode: string; hintIndex: 0 | 1 } }
	| {
			name: "fabble_puzzle_completed";
			data: { mode: string; result: "won" | "lost"; guessCount: number };
	  }
	| {
			name: "fabble_endless_guess_submitted";
			data: { guessNumber: number; correct: boolean };
	  }
	| {
			name: "fabble_endless_completed";
			data: { result: "won" | "gave_up"; guessCount: number };
	  }
	| { name: "bug_report_submitted" };

export function trackEvent(event: AnalyticsEvent): void {
	activeProvider.track(event.name, "data" in event ? event.data : undefined);
}

declare global {
	interface Window {
		umami?: {
			track(
				name: string,
				data?: Record<string, string | number | boolean>,
			): void;
		};
	}
}
