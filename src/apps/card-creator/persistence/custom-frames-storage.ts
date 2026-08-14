import { base64ToBlob, blobToBase64 } from "@fabkit/shared/blob";
import { getBucketKeyForFrame } from "../config/frame-buckets.ts";
import type { RenderConfigVariation } from "../config/rendering.ts";
import { sha256Hex } from "../utils/frame-image.ts";
import { db } from "./db.ts";

// ─── Stored types ──────────────────────────────────────────────────────────

/**
 * Normalised frame image bytes, content-addressed. One row per distinct
 * uploaded image, regardless of how many stock entries it's mirrored onto
 * (see StoredCustomFrame) — this is what keeps N mirrors of one upload from
 * costing N copies of the (resized, ~500KB) image blob.
 */
export interface StoredFrameImage {
	/** PRIMARY KEY. SHA-256 hex of `image`'s bytes as actually stored.
	 *  Recomputed locally on import — never trusted from a file's claim. */
	payloadHash: string;
	/** SHA-256 hex of the ORIGINAL uploaded file's bytes, pre-resize. Indexed.
	 *  Deterministic across browsers and resize-parameter changes, so this —
	 *  not payloadHash — is the upload-time dedup/grouping identity. */
	sourceHash: string;
	/** Normalisation spec generation, bumped if the resize target ever changes. */
	normVersion: number;
	/** 900×1256 WebP (2x the 450×628 render viewBox). */
	image: Blob;
	/** 225×314 WebP, used by the /custom-frames grid and by .fabreport. */
	preview: Blob;
	/** Byte size of `image`, denormalised so quota/UI maths never touches the Blob. */
	byteSize: number;
	createdAt: number;
}

/**
 * A pickable custom frame: one uploaded image, mirrored onto exactly one
 * stock manifest entry. A single image can have several StoredCustomFrame
 * rows (one per mirrored stock entry) sharing one StoredFrameImage row —
 * necessary because a stock CardBack's `type` can't be derived from its
 * `renderer`, so a custom frame must explicitly declare which type/style
 * combinations it's usable in.
 */
export interface StoredCustomFrame {
	/** Negative, monotonically decreasing. Never 0 — see allocateCustomFrameId.
	 *  Manually allocated; the Dexie schema declares this as a plain (non
	 *  auto-increment) primary key. */
	id: number;
	/** User-visible name of the underlying upload; shared by all its mirrors. */
	name: string;
	/** FK -> StoredFrameImage.payloadHash. Indexed. */
	payloadHash: string;
	/** Copied VERBATIM from the mirrored stock manifest entry. */
	type: string;
	dented: boolean;
	renderer: RenderConfigVariation;
	/** id of the stock CardBack this row mirrors. Provenance + UI labelling. */
	mirrorsCardBackId: number;
	createdAt: number;
	updatedAt: number;
	schemaVersion?: string;
}

// ─── ID allocation ─────────────────────────────────────────────────────────

const FRAME_ID_COUNTER_ROW_ID = 0;

/**
 * Allocates `count` new custom-frame ids inside the given transaction (which
 * must include `db.frameIdCounter`), via a single query rather than one per
 * id (a multi-mirror upload allocates several at once — see
 * addFrameImageAndMirrors). Ids are negative and strictly decreasing so they
 * can never collide with a positive stock manifest id, and 0 is never
 * allocated — `state.CardBack?.id || null` in card-storage.ts uses `||`, not
 * `??`, so an id of 0 would serialize to `null` and silently lose the
 * reference.
 *
 * The next id is read from a PERSISTED counter, not derived from
 * `customFrames`' current rows: deriving it from current rows means deleting
 * every mirror of a frame frees its id for reuse, so a later, unrelated
 * upload could be allocated that same negative id — silently repointing any
 * card still holding a `missing: true` placeholder for the deleted frame at
 * the new image. The counter only ever decreases, even across deletions.
 */
async function allocateCustomFrameIds(count: number): Promise<number[]> {
	const counter = await db.frameIdCounter.get(FRAME_ID_COUNTER_ROW_ID);
	let next = counter?.next;
	if (next === undefined) {
		// First allocation ever for this database. Seed from any pre-existing
		// customFrames rows so an upgrade from schema v3 (where the counter
		// table didn't exist) can't reissue an id that's already in use.
		const lowest = await db.customFrames.orderBy("id").first();
		next = Math.min(lowest?.id ?? 0, 0);
	}
	const ids: number[] = [];
	for (let i = 0; i < count; i++) {
		next -= 1;
		ids.push(next);
	}
	await db.frameIdCounter.put({ id: FRAME_ID_COUNTER_ROW_ID, next });
	return ids;
}

// ─── Frame images ──────────────────────────────────────────────────────────

export async function getFrameImageBySourceHash(
	sourceHash: string,
): Promise<StoredFrameImage | undefined> {
	return db.frameImages.get({ sourceHash });
}

export async function getFrameImageByPayloadHash(
	payloadHash: string,
): Promise<StoredFrameImage | undefined> {
	return db.frameImages.get(payloadHash);
}

export async function getAllFrameImages(): Promise<StoredFrameImage[]> {
	return db.frameImages.toArray();
}

// ─── Custom frames CRUD ────────────────────────────────────────────────────

export async function getAllCustomFrames(): Promise<StoredCustomFrame[]> {
	return db.customFrames.toArray();
}

export async function getCustomFrameRowById(
	id: number,
): Promise<StoredCustomFrame | undefined> {
	return db.customFrames.get(id);
}

/** Mirror rows for one uploaded image. Used to grey out/exclude stock entries
 * the image is already mirrored onto, enforcing (payloadHash, mirrorsCardBackId)
 * uniqueness at the UI layer (no Dexie compound-index constraint — see
 * addCustomFrameMirror's callers, which are expected to check this first). */
export async function getCustomFramesByPayloadHash(
	payloadHash: string,
): Promise<StoredCustomFrame[]> {
	return db.customFrames.where("payloadHash").equals(payloadHash).toArray();
}

export interface AddCustomFrameInput {
	name: string;
	type: string;
	dented: boolean;
	renderer: RenderConfigVariation;
	mirrorsCardBackId: number;
}

/**
 * Adds one mirror row for an image that's already stored (by payloadHash).
 * Callers adding a brand-new upload should call addFrameImageAndMirror
 * instead, which creates the StoredFrameImage row first.
 */
export async function addCustomFrameMirror(
	payloadHash: string,
	input: AddCustomFrameInput,
): Promise<StoredCustomFrame> {
	return db.transaction("rw", db.customFrames, db.frameIdCounter, async () => {
		const [id] = await allocateCustomFrameIds(1);
		const now = Date.now();
		const row: StoredCustomFrame = {
			id,
			name: input.name,
			payloadHash,
			type: input.type,
			dented: input.dented,
			renderer: input.renderer,
			mirrorsCardBackId: input.mirrorsCardBackId,
			createdAt: now,
			updatedAt: now,
			schemaVersion: __APP_VERSION__,
		};
		await db.customFrames.add(row);
		return row;
	});
}

/**
 * Adds a brand-new upload: inserts the StoredFrameImage row (unless one with
 * the same payloadHash already exists — same normalised bytes, reused as-is)
 * plus one or more StoredCustomFrame mirror rows, in a single transaction.
 */
export async function addFrameImageAndMirrors(
	image: Omit<StoredFrameImage, "createdAt">,
	mirrors: AddCustomFrameInput[],
): Promise<StoredCustomFrame[]> {
	return db.transaction(
		"rw",
		db.frameImages,
		db.customFrames,
		db.frameIdCounter,
		async () => {
			const existing = await db.frameImages.get(image.payloadHash);
			if (!existing) {
				await db.frameImages.add({ ...image, createdAt: Date.now() });
			}

			const ids = await allocateCustomFrameIds(mirrors.length);
			const rows: StoredCustomFrame[] = [];
			for (let i = 0; i < mirrors.length; i++) {
				const mirror = mirrors[i];
				const id = ids[i];
				const now = Date.now();
				const row: StoredCustomFrame = {
					id,
					name: mirror.name,
					payloadHash: image.payloadHash,
					type: mirror.type,
					dented: mirror.dented,
					renderer: mirror.renderer,
					mirrorsCardBackId: mirror.mirrorsCardBackId,
					createdAt: now,
					updatedAt: now,
					schemaVersion: __APP_VERSION__,
				};
				await db.customFrames.add(row);
				rows.push(row);
			}
			return rows;
		},
	);
}

/**
 * Cards referencing this frame id as either half. Full-table filter rather
 * than an index — negative ids aren't indexed on `cards`, and gallery sizes
 * are in the hundreds, not the tens of thousands.
 */
export async function countCardsUsingFrame(id: number): Promise<number> {
	return db.cards
		.filter(
			(card) => card.state.CardBack === id || card.state.CardBackRight === id,
		)
		.count();
}

/**
 * Cards referencing ANY of the given frame ids, counted once per card even
 * if it references two of them (e.g. a hybrid card using one mirror of an
 * image as its left half and another mirror of the SAME image as its right
 * half). Used for a group's total usage count — summing countCardsUsingFrame
 * per mirror would double-count that card. Per-mirror usage (e.g. "used on 2
 * cards as Flat") should still call countCardsUsingFrame individually.
 */
export async function countCardsUsingAnyFrame(ids: number[]): Promise<number> {
	if (ids.length === 0) return 0;
	const idSet = new Set(ids);
	return db.cards
		.filter(
			(card) =>
				(card.state.CardBack !== null && idSet.has(card.state.CardBack)) ||
				(card.state.CardBackRight !== null &&
					idSet.has(card.state.CardBackRight)),
		)
		.count();
}

/**
 * Removes one mirror row. If it was the last row referencing its image, the
 * StoredFrameImage row is cascade-deleted in the same transaction — no
 * refcount field to drift out of sync.
 */
export async function deleteCustomFrameMirror(id: number): Promise<void> {
	await db.transaction("rw", db.customFrames, db.frameImages, async () => {
		const row = await db.customFrames.get(id);
		if (!row) return;
		await db.customFrames.delete(id);
		const remaining = await db.customFrames
			.where("payloadHash")
			.equals(row.payloadHash)
			.count();
		if (remaining === 0) {
			await db.frameImages.delete(row.payloadHash);
		}
	});
}

/** Deletes every mirror sharing `payloadHash`, plus the image itself. */
export async function deleteCustomFrameImage(
	payloadHash: string,
): Promise<void> {
	await db.transaction("rw", db.customFrames, db.frameImages, async () => {
		await db.customFrames.where("payloadHash").equals(payloadHash).delete();
		await db.frameImages.delete(payloadHash);
	});
}

// ─── Portable export/import ─────────────────────────────────────────────────

/**
 * Frame metadata as embedded in a `.fabkit`/`.fabgallery` file, alongside
 * `state` (same placement as `folders`) — never inside `SerializedCardState`,
 * so it's untouched by MIGRATIONS. `id` and `payloadHash` are the
 * EXPORTING device's values; neither is trusted on import (see
 * reconcileImportedCustomFrames) — `payloadHash` here only links a meta to
 * its image within the same file's `customFrameImages` array.
 */
export interface EmbeddedCustomFrameMeta {
	id: number;
	name: string;
	type: string;
	dented: boolean;
	renderer: RenderConfigVariation;
	mirrorsCardBackId: number;
	payloadHash: string;
}

/**
 * One distinct image, embedded once regardless of how many
 * EmbeddedCustomFrameMeta entries (across however many cards, for a
 * `.fabgallery`) reference it via `payloadHash` — this is the hoist+dedupe
 * the plan calls for. `image` is the full 900×1256 asset and is OMITTED for
 * a preview-only embed (currently: `.fabreport`, which never needs to
 * reconstruct an actual renderable frame, only show a thumbnail).
 */
export interface EmbeddedCustomFrameImage {
	payloadHash: string;
	image?: string;
	preview: string;
	byteSize: number;
	sourceHash: string;
	normVersion: number;
}

/**
 * Builds the embeddable (meta, image) pair for one card's referenced custom
 * frames (its CardBack and/or CardBackRight, whichever are negative ids).
 * Used both for a standalone `.fabkit` export and, per-card, to compute the
 * hoisted set for a `.fabgallery` export (see embedCustomFramesForCards).
 */
export async function embedCustomFramesForCard(
	cardBackId: number | null,
	cardBackRightId: number | null,
	includeFullResImages: boolean,
): Promise<{
	metas: EmbeddedCustomFrameMeta[];
	images: EmbeddedCustomFrameImage[];
} | null> {
	const ids = [cardBackId, cardBackRightId].filter(
		(id): id is number => id !== null && id < 0,
	);
	if (ids.length === 0) return null;

	const metas: EmbeddedCustomFrameMeta[] = [];
	const imagesByHash = new Map<string, EmbeddedCustomFrameImage>();
	for (const id of ids) {
		const row = await getCustomFrameRowById(id);
		// Locally missing (deleted, or a stale reference) — simply not embedded.
		// The card's own state.CardBack id is untouched by this, so on import
		// it resolves through the exact same sign-discriminated missing-frame
		// placeholder path as any other unresolvable custom-frame id.
		if (!row) continue;
		metas.push({
			id: row.id,
			name: row.name,
			type: row.type,
			dented: row.dented,
			renderer: row.renderer,
			mirrorsCardBackId: row.mirrorsCardBackId,
			payloadHash: row.payloadHash,
		});
		if (!imagesByHash.has(row.payloadHash)) {
			const imageRow = await getFrameImageByPayloadHash(row.payloadHash);
			if (imageRow) {
				imagesByHash.set(row.payloadHash, {
					payloadHash: row.payloadHash,
					image: includeFullResImages
						? await blobToBase64(imageRow.image)
						: undefined,
					preview: await blobToBase64(imageRow.preview),
					byteSize: imageRow.byteSize,
					sourceHash: imageRow.sourceHash,
					normVersion: imageRow.normVersion,
				});
			}
		}
	}
	if (metas.length === 0) return null;
	return { metas, images: Array.from(imagesByHash.values()) };
}

/**
 * Hoisted, gallery-wide version of embedCustomFramesForCard: every mirror
 * referenced by ANY of the given cards, and every distinct image those
 * mirrors point to, each embedded exactly once — this is what keeps N cards
 * sharing one custom frame from costing N copies of its (~500KB) image in
 * the exported `.fabgallery`.
 */
export async function embedCustomFramesForCards(
	cards: { CardBack: number | null; CardBackRight: number | null }[],
	includeFullResImages: boolean,
): Promise<{
	metas: EmbeddedCustomFrameMeta[];
	images: EmbeddedCustomFrameImage[];
} | null> {
	const metasById = new Map<number, EmbeddedCustomFrameMeta>();
	const imagesByHash = new Map<string, EmbeddedCustomFrameImage>();

	for (const card of cards) {
		const embedded = await embedCustomFramesForCard(
			card.CardBack,
			card.CardBackRight,
			includeFullResImages,
		);
		if (!embedded) continue;
		for (const meta of embedded.metas) metasById.set(meta.id, meta);
		for (const image of embedded.images) {
			if (!imagesByHash.has(image.payloadHash)) {
				imagesByHash.set(image.payloadHash, image);
			}
		}
	}

	if (metasById.size === 0) return null;
	return {
		metas: Array.from(metasById.values()),
		images: Array.from(imagesByHash.values()),
	};
}

/**
 * Reconciles frames embedded in an imported `.fabkit`/`.fabgallery` file
 * against local storage, returning a map from the file's (foreign) frame ids
 * to the LOCAL ids they resolve to.
 *
 * SECURITY: a meta/image pair's claimed `payloadHash` is used only to link
 * them to each other WITHIN this file — it is never trusted for storage or
 * for matching against local data. Every image's real hash is recomputed
 * here from the bytes actually received, and that recomputed hash is what
 * gets stored and matched against. A crafted file that claims an existing
 * local hash for different pixels is caught by this recompute; it can never
 * silently repoint a local mirror at attacker-chosen image bytes.
 *
 * All base64 decoding and hashing happens BEFORE the one write transaction
 * below — Dexie transactions do not survive an awaited non-Dexie promise
 * (crypto.subtle.digest, fetch-based base64 decode) partway through them,
 * and doing the writes in one transaction (rather than one per mirror, as
 * the interactive upload dialog does) makes a mid-import failure leave no
 * orphan frameImages rows.
 *
 * A meta with no matching image (e.g. `.fabreport`'s preview-only embeds,
 * which never carry `image`) is simply left out of the returned map — the
 * caller's id-remap step treats that exactly like any other unresolvable
 * custom-frame id (missing-frame placeholder), which is the correct,
 * data-preserving outcome.
 */
export async function reconcileImportedCustomFrames(
	metas: EmbeddedCustomFrameMeta[] | undefined,
	images: EmbeddedCustomFrameImage[] | undefined,
): Promise<Map<number, number>> {
	const idMap = new Map<number, number>();
	if (!metas || metas.length === 0) return idMap;

	const claimedToReal = new Map<
		string,
		{
			hash: string;
			image: Blob;
			preview: Blob;
			byteSize: number;
			sourceHash: string;
			normVersion: number;
		}
	>();
	for (const img of images ?? []) {
		if (!img.image) continue;
		const imageBlob = await base64ToBlob(img.image);
		const previewBlob = await base64ToBlob(img.preview);
		const hash = await sha256Hex(await imageBlob.arrayBuffer());
		claimedToReal.set(img.payloadHash, {
			hash,
			image: imageBlob,
			preview: previewBlob,
			byteSize: img.byteSize,
			sourceHash: img.sourceHash,
			normVersion: img.normVersion,
		});
	}

	// Reads before the write transaction — see the doc comment above. Single-
	// user local-only app, so a write racing between this read and the
	// transaction below is not a realistic concern.
	const toInsertImages: StoredFrameImage[] = [];
	const seenHashes = new Set<string>();
	for (const resolved of claimedToReal.values()) {
		if (seenHashes.has(resolved.hash)) continue;
		seenHashes.add(resolved.hash);
		const existing = await db.frameImages.get(resolved.hash);
		if (!existing) {
			toInsertImages.push({
				payloadHash: resolved.hash,
				sourceHash: resolved.sourceHash,
				normVersion: resolved.normVersion,
				image: resolved.image,
				preview: resolved.preview,
				byteSize: resolved.byteSize,
				createdAt: Date.now(),
			});
		}
	}

	const toInsertMirrors: { meta: EmbeddedCustomFrameMeta; realHash: string }[] =
		[];
	for (const meta of metas) {
		const resolved = claimedToReal.get(meta.payloadHash);
		if (!resolved) continue;
		// Reuse an existing LOCAL mirror if one already occupies this exact
		// (image, frame bucket) pair — repeated imports of the same file don't
		// pile up duplicate picker entries. clearGallery() (replace-mode
		// import) deliberately does NOT clear frameImages/customFrames, so the
		// local frame library survives a replace and this reuse check applies
		// there too, not just in merge mode.
		//
		// Matched on the bucket key (type + dented), not mirrorsCardBackId: a
		// pre-bucket-model export can carry a mirrorsCardBackId that isn't this
		// bucket's representative stock entry (it names whichever stock frame
		// the uploader happened to tick), and under the bucket model two rows
		// with the same (type, dented) pair are functionally identical anyway
		// — see config/frame-buckets.ts.
		const localMatches = await db.customFrames
			.where("payloadHash")
			.equals(resolved.hash)
			.toArray();
		const existingMirror = localMatches.find(
			(m) => getBucketKeyForFrame(m) === getBucketKeyForFrame(meta),
		);
		if (existingMirror) {
			idMap.set(meta.id, existingMirror.id);
		} else {
			toInsertMirrors.push({ meta, realHash: resolved.hash });
		}
	}

	if (toInsertImages.length === 0 && toInsertMirrors.length === 0) {
		return idMap;
	}

	await db.transaction(
		"rw",
		db.frameImages,
		db.customFrames,
		db.frameIdCounter,
		async () => {
			for (const image of toInsertImages) {
				await db.frameImages.add(image);
			}
			if (toInsertMirrors.length > 0) {
				const ids = await allocateCustomFrameIds(toInsertMirrors.length);
				const now = Date.now();
				for (let i = 0; i < toInsertMirrors.length; i++) {
					const { meta, realHash } = toInsertMirrors[i];
					const id = ids[i];
					await db.customFrames.add({
						id,
						name: meta.name,
						payloadHash: realHash,
						type: meta.type,
						dented: meta.dented,
						renderer: meta.renderer,
						mirrorsCardBackId: meta.mirrorsCardBackId,
						createdAt: now,
						updatedAt: now,
						schemaVersion: __APP_VERSION__,
					});
					idMap.set(meta.id, id);
				}
			}
		},
	);

	return idMap;
}

/**
 * Reserved id used to remap a foreign (imported) negative frame id that
 * collides with an UNRELATED local frame already using that literal number —
 * two independently-allocated devices both start at -1, so a foreign -1 is
 * quite likely to name a different local frame, not "the same frame, just
 * not embedded". Keeping the foreign id as-is in that case would silently
 * resolve to (and render) the wrong local frame's pixels.
 *
 * This value is NEVER written as a customFrames row — it only ever appears
 * as a StoredCard.state.CardBack/CardBackRight number, where it's
 * guaranteed to miss every lookup and fall through to the ordinary
 * missing-frame placeholder path, same as any other unresolvable custom id.
 * allocateCustomFrameIds only ever derives from EXISTING rows, so never
 * inserting a row here means it can never be "reissued" to a real frame.
 */
export const UNRESOLVABLE_FOREIGN_FRAME_ID = -900_000_000;

/**
 * Remaps one CardBack/CardBackRight id through an id map produced by
 * reconcileImportedCustomFrames. Positive ids (stock frames) and `null` pass
 * through untouched — only the negative custom-frame id space is ever
 * remapped. See UNRESOLVABLE_FOREIGN_FRAME_ID's doc comment for why an
 * unmapped negative id can't simply be kept as-is.
 */
export async function remapCustomFrameId(
	id: number | null | undefined,
	idMap: Map<number, number>,
): Promise<number | null> {
	// `id` is typed as `number | null` at the call sites, but legacy/malformed
	// fixtures can carry `undefined` (never explicitly `null`) — `undefined >=
	// 0` is false, so without this explicit check it falls through to a Dexie
	// `.get(undefined)` call, which throws rather than returning `undefined`.
	if (id === null || id === undefined) return null;
	if (id >= 0) return id;
	const mapped = idMap.get(id);
	if (mapped !== undefined) return mapped;
	const localRow = await getCustomFrameRowById(id);
	return localRow ? UNRESOLVABLE_FOREIGN_FRAME_ID : id;
}
