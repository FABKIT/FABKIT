/**
 * Custom Frames Registry
 *
 * In-memory registry of user-uploaded card frames, hydrated from IndexedDB
 * (see persistence/custom-frames-storage.ts). Exists as a separate store from
 * useCardCreator because deserializeCardState (card-storage.ts) is
 * synchronous and needs a synchronous way to resolve a stored frame id to a
 * renderable CardCreatorCardBack.
 *
 * Three invariants matter and are easy to violate by "simplifying" this file:
 *
 * 1. STABLE OBJECT IDENTITY — a frame object, once built, is handed out by
 *    reference for as long as its underlying row is unchanged. NormalRenderer
 *    memoizes on frame identity; rebuilding fresh objects on every hydrate
 *    would invalidate that memo for frames that didn't actually change.
 * 2. OBJECT URLS ARE CREATED EAGERLY, HERE — never lazily inside a render
 *    (e.g. from inside a useMemo in the renderer). Lazy-on-first-render-access
 *    would be a side effect during render on a store-owned object, and would
 *    make "URL present before first paint" circular. Eager creation, at
 *    hydrate time, makes it not circular: the URL exists before any component
 *    mounts.
 * 3. RELOAD DIFFS, IT NEVER REBUILDS — a cross-tab BroadcastChannel message
 *    can trigger a reload while this tab is actively rendering or mid-export
 *    (snapdom). Revoking and recreating every URL on every reload would
 *    reintroduce the exact revoke-race that ruled out the effect-based
 *    `useObjectURL` hook for this layer in the first place (see
 *    NormalRenderer.tsx). Reused URLs/objects for unchanged rows; only
 *    genuinely-removed images get revoked, and not until the next idle tick.
 */

import { getCardBackTypesForCardType } from "@fabkit/shared/config/cards/card_backs.ts";
import type { CardStyle } from "@fabkit/shared/config/cards/card_styles.ts";
import type { CardType } from "@fabkit/shared/config/cards/types.ts";
import { create } from "zustand";
import type { CardCreatorCardBack } from "../config/rendering.ts";
import {
	getAllCustomFrames,
	getAllFrameImages,
	type StoredCustomFrame,
	type StoredFrameImage,
} from "../persistence/custom-frames-storage.ts";

interface CustomFramesRegistryState {
	frames: CardCreatorCardBack[];
	loaded: boolean;
}

const useCustomFramesStore = create<CustomFramesRegistryState>(() => ({
	frames: [],
	loaded: false,
}));

/** blob: URLs, keyed by payloadHash so every mirror of one image shares
 * exactly one URL. Deliberately not part of Zustand state — a URL is an
 * imperative resource with its own lifecycle, not render-triggering data. */
const urlCache = new Map<string, string>();

/** Frame objects + their source row, keyed by frame id, so reloadCustomFrames
 * can hand back the SAME object reference when a row hasn't changed. */
const frameCache = new Map<
	number,
	{ frame: CardCreatorCardBack; row: StoredCustomFrame }
>();

function rowsEqual(a: StoredCustomFrame, b: StoredCustomFrame): boolean {
	return (
		a.payloadHash === b.payloadHash &&
		a.name === b.name &&
		a.type === b.type &&
		a.dented === b.dented &&
		a.renderer === b.renderer &&
		a.updatedAt === b.updatedAt
	);
}

function buildFrame(
	row: StoredCustomFrame,
	imagesByHash: Map<string, StoredFrameImage>,
): CardCreatorCardBack {
	let objectUrl = urlCache.get(row.payloadHash);
	if (!objectUrl) {
		const image = imagesByHash.get(row.payloadHash);
		// A row with no matching image row would be a data-integrity gap (e.g.
		// an interrupted transaction) — surfaced as a frame with no objectUrl,
		// which the renderer's href resolver falls through on like any other
		// unresolvable image, rather than throwing.
		if (image) {
			objectUrl = URL.createObjectURL(image.image);
			urlCache.set(row.payloadHash, objectUrl);
		}
	}
	return {
		id: row.id,
		name: row.name,
		type: row.type,
		dented: row.dented,
		renderer: row.renderer,
		source: "custom",
		// Single image at pitch 0 — real pitches are 1/2/3, so this never
		// matches and the renderer's existing `?? images[0]` fallback always
		// fires for custom frames, with no renderer-side special case.
		images: [{ id: 0, pitch: 0, fileName: "", objectUrl }],
	};
}

let loadPromise: Promise<void> | null = null;

/**
 * Awaited before any card deserialization, so the registry is never queried
 * empty (a card referencing a real custom frame would otherwise resolve as
 * "missing" on first load). Idempotent and memoised — safe to call from
 * multiple route loaders/components without duplicating the hydrate.
 */
export function ensureCustomFramesLoaded(): Promise<void> {
	if (!loadPromise) {
		loadPromise = reloadCustomFrames().catch((error) => {
			// Don't cache a rejected promise forever — every route loader/
			// component awaiting this (gallery, card-creator, export,
			// custom-frames, CardThumbnail.handleEdit, bug-report-viewer's
			// restoreStore) would otherwise stay permanently broken for the rest
			// of the session after one transient failure (e.g. IndexedDB briefly
			// blocked by the new v3 schema upgrade in another tab). Reset so the
			// next caller gets a fresh attempt instead.
			loadPromise = null;
			throw error;
		});
	}
	return loadPromise;
}

/**
 * Reloads from IndexedDB and diffs against the current in-memory state — see
 * the module doc comment for why this must never be a blind rebuild.
 */
export async function reloadCustomFrames(): Promise<void> {
	const [rows, images] = await Promise.all([
		getAllCustomFrames(),
		getAllFrameImages(),
	]);
	const imagesByHash = new Map(images.map((img) => [img.payloadHash, img]));
	const liveHashes = new Set(rows.map((row) => row.payloadHash));

	const nextFrames: CardCreatorCardBack[] = [];
	const nextCache = new Map<
		number,
		{ frame: CardCreatorCardBack; row: StoredCustomFrame }
	>();
	for (const row of rows) {
		const cached = frameCache.get(row.id);
		// Reuse the cached frame only when its row is unchanged AND it already
		// resolved a real objectUrl. Without the second condition, a frame built
		// once against a data-integrity gap (a customFrames row with no matching
		// frameImages row — see buildFrame) would stay permanently broken even
		// after the missing image row is later restored, since rowsEqual alone
		// can't see that: the customFrames row itself never changed.
		const frame =
			cached && rowsEqual(cached.row, row) && cached.frame.images[0]?.objectUrl
				? cached.frame
				: buildFrame(row, imagesByHash);
		nextCache.set(row.id, { frame, row });
		nextFrames.push(frame);
	}

	frameCache.clear();
	for (const [id, entry] of nextCache) frameCache.set(id, entry);

	useCustomFramesStore.setState({ frames: nextFrames, loaded: true });

	// Only hashes that no longer belong to ANY row are actually gone. Defer
	// revocation off the current tick — a synchronous revoke here could still
	// race a render or an in-flight snapdom capture that just read the URL.
	const staleHashes = Array.from(urlCache.keys()).filter(
		(hash) => !liveHashes.has(hash),
	);
	if (staleHashes.length > 0) {
		const revoke = () => {
			for (const hash of staleHashes) {
				const url = urlCache.get(hash);
				if (url) URL.revokeObjectURL(url);
				urlCache.delete(hash);
			}
		};
		if (typeof requestIdleCallback === "function") {
			requestIdleCallback(revoke, { timeout: 2000 });
		} else {
			setTimeout(revoke, 0);
		}
	}
}

// ─── Cross-tab sync ─────────────────────────────────────────────────────────

/**
 * Undefined in environments without BroadcastChannel (older Safari, some test
 * runners) — every use below is guarded, so cross-tab sync degrades to "no
 * sync" rather than throwing.
 */
const channel: BroadcastChannel | undefined =
	typeof BroadcastChannel !== "undefined"
		? new BroadcastChannel("fabkit-custom-frames")
		: undefined;

if (channel) {
	// Reload, never rebuild — see the module doc comment. A message from
	// another tab (upload/delete) means our IndexedDB view is stale, not that
	// we know what changed, so a full reloadCustomFrames() diff is correct.
	channel.onmessage = () => {
		reloadCustomFrames().catch((error) => {
			console.error("Failed to sync custom frames from another tab:", error);
		});
	};
}

/**
 * Call after any local mutation (upload, add-mirror, delete) that other tabs
 * need to know about. Does NOT reload this tab's own state — the caller
 * already has fresh data from the mutation it just performed and should call
 * reloadCustomFrames() itself before this, to avoid a redundant IndexedDB
 * round-trip.
 */
export function broadcastCustomFramesChanged(): void {
	channel?.postMessage("changed");
}

/** Synchronous accessor for non-React call sites (deserializeCardState). */
export function getCustomFrameById(
	id: number | null | undefined,
): CardCreatorCardBack | undefined {
	if (id == null) return undefined;
	return useCustomFramesStore.getState().frames.find((f) => f.id === id);
}

/**
 * Pure filter over an explicit `frames` snapshot — deliberately NOT reading
 * `useCustomFramesStore.getState()` internally. A zero-argument call reading
 * external mutable state looks referentially transparent to React Compiler's
 * auto-memoization (same "arguments", so it's free to skip re-invoking the
 * function on later renders) — that's what silently broke live updates on
 * the /custom-frames page and, potentially, the card-back picker. Passing
 * `frames` in makes the real dependency visible, both to the compiler and to
 * a human reading the call site. Callers inside a React render/useMemo
 * should pass the array from `useCustomFrames()`; non-React callers (the
 * card-creator store) should pass `getCustomFramesSnapshot()`.
 */
export function getCustomFramesForTypeAndStyle(
	frames: CardCreatorCardBack[],
	type: CardType | null,
	style: CardStyle,
): CardCreatorCardBack[] {
	// Meld frames aren't supported for custom frames yet — MeldRenderer has no
	// blob-href path (see NormalRenderer.tsx's resolveCardBackImage vs.
	// MeldRenderer.tsx's still-static-only equivalent).
	if (type === null || type === "meld") return [];
	// A custom frame's `type` field mirrors a stock CardBack.type (e.g.
	// "general"), NOT the raw CardType (e.g. "action") — the two are related
	// by getCardBackTypesForCardType's mapping, not equality. Comparing
	// f.type === type directly would silently match nothing for every card
	// type whose CardType string doesn't happen to equal its CardBack.type.
	const compatibleTypes = getCardBackTypesForCardType(type);
	const dented = style === "dented";
	return frames.filter(
		(f) => compatibleTypes.includes(f.type) && f.dented === dented,
	);
}

export interface CustomFrameGroup {
	payloadHash: string;
	/** Name of the first mirror; all mirrors of one upload share a name today. */
	name: string;
	createdAt: number;
	/** One entry per stock manifest entry this image is mirrored onto. */
	mirrors: CardCreatorCardBack[];
}

/**
 * Groups pickable frames by their underlying image. The /custom-frames grid's
 * unit is the uploaded image, not the row — one upload can be mirrored onto
 * several stock entries and must render as a single tile with mirror chips,
 * not one indistinguishable tile per mirror.
 *
 * Takes `frames` explicitly rather than reading the store internally — see
 * getCustomFramesForTypeAndStyle's doc comment for why a zero-argument read
 * of external mutable state breaks under React Compiler's auto-memoization.
 * `frameCache` is still read internally (not passed in): it's a plain
 * synchronous lookup Map, always repopulated in lockstep with `frames`
 * inside reloadCustomFrames, so it can never be stale relative to whatever
 * `frames` snapshot is passed here.
 */
export function getCustomFramesGroupedByImage(
	frames: CardCreatorCardBack[],
): CustomFrameGroup[] {
	const byHash = new Map<string, CardCreatorCardBack[]>();
	for (const frame of frames) {
		const hash = frameCache.get(frame.id)?.row.payloadHash;
		if (!hash) continue;
		const list = byHash.get(hash) ?? [];
		list.push(frame);
		byHash.set(hash, list);
	}
	return Array.from(byHash.entries()).map(([payloadHash, mirrors]) => ({
		payloadHash,
		name: mirrors[0].name,
		createdAt: frameCache.get(mirrors[0].id)?.row.createdAt ?? 0,
		mirrors,
	}));
}

/** React hook for components that need to re-render when the registry changes. */
export function useCustomFrames(): CardCreatorCardBack[] {
	return useCustomFramesStore((s) => s.frames);
}

/**
 * Synchronous snapshot for non-React callers (the card-creator Zustand
 * store's own actions, which run outside any component render and so are
 * never subject to React Compiler memoization — safe to read imperatively).
 * React code should use the `useCustomFrames()` hook instead, so it
 * re-renders on change.
 */
export function getCustomFramesSnapshot(): CardCreatorCardBack[] {
	return useCustomFramesStore.getState().frames;
}
