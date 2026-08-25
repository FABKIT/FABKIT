import { loadPresetLink } from "@fabkit/apps/card-creator/preset-link/preset-link.ts";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PresetSearch {
	// `unknown`, not `string`: TanStack Router's default search parser
	// (parseSearchWith(JSON.parse) in @tanstack/router-core) auto-JSON-parses
	// any search value that happens to be valid JSON — which a well-formed
	// preset payload always is. So by the time validateSearch sees it, `link`
	// is normally already a parsed object, not the raw string. It only stays
	// a string when the payload was malformed JSON to begin with. The loader
	// below handles both shapes.
	link?: unknown;
}

/**
 * Resolver route for card preset links — see
 * `@fabkit/apps/card-creator/preset-link/preset-link.ts` for the payload
 * contract. Kept separate from `/card-creator` so this route's only job is
 * "parse the link, apply it, hand off"; `/card-creator` itself stays a
 * plain form route with no preset-link concerns at all. The card's fields
 * apply instantly; the wait the `pendingComponent` below covers is the
 * `CardArtwork` image, the one field a preset link fetches (artwork.ts) —
 * awaited here so the editor opens on a finished card rather than popping
 * the artwork in afterwards.
 */
export const Route = createFileRoute("/preset")({
	component: () => null,
	validateSearch: (search: Record<string, unknown>): PresetSearch => ({
		link: "link" in search ? search.link : undefined,
	}),
	loaderDeps: ({ search }) => ({ link: search.link }),
	pendingComponent: ResolvingPresetScreen,
	pendingMs: 0,
	loader: async ({ deps, abortController }) => {
		// Either an already-parsed object (the common case — see the
		// PresetSearch comment above) or a raw string (malformed JSON, left
		// un-parsed by the router). loadPresetLink validates the shape itself
		// either way, so a string here just needs one JSON.parse first.
		let payload: unknown = deps.link;
		if (typeof payload === "string") {
			try {
				payload = JSON.parse(payload);
			} catch (error) {
				console.error(
					'[preset-link] Ignoring preset link: the "link" search param isn\'t valid JSON.',
					error,
				);
				payload = null;
			}
		}

		if (payload !== undefined) {
			// The router aborts this controller when the navigation is
			// interrupted, which is what stops a slow artwork fetch from
			// landing on whatever card the user opened instead.
			await loadPresetLink(payload, abortController.signal);
		}
		throw redirect({ to: "/card-creator", replace: true });
	},
});

function ResolvingPresetScreen() {
	const { t } = useTranslation("card-creator");
	return (
		<div className="flex flex-1 flex-col justify-center items-center min-h-[50vh] p-4 gap-4">
			<LoaderCircle className="animate-spin h-8 w-8 text-heading" />
			<span className="text-body">{t("preset_link.resolving_label")}</span>
		</div>
	);
}
