import type { RenderConfigVariation } from "../config/rendering.ts";
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

/**
 * Allocates `count` new custom-frame ids inside the given transaction, via a
 * single query rather than one per id (a multi-mirror upload allocates
 * several at once — see addFrameImageAndMirrors). Ids are negative and
 * strictly decreasing so they can never collide with a positive stock
 * manifest id, and 0 is never allocated — `state.CardBack?.id || null` in
 * card-storage.ts uses `||`, not `??`, so an id of 0 would serialize to
 * `null` and silently lose the reference.
 */
async function allocateCustomFrameIds(count: number): Promise<number[]> {
	const lowest = await db.customFrames.orderBy("id").first();
	let next = Math.min(lowest?.id ?? 0, 0);
	const ids: number[] = [];
	for (let i = 0; i < count; i++) {
		next -= 1;
		ids.push(next);
	}
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
	return db.transaction("rw", db.customFrames, async () => {
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
	return db.transaction("rw", db.frameImages, db.customFrames, async () => {
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
	});
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
