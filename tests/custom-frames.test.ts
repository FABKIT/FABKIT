import { beforeEach, describe, expect, it } from "bun:test";
import { getAvailableCardBacks } from "../src/apps/card-creator/config/card-backs.ts";
import {
	addFrameImageAndMirrors,
	countCardsUsingFrame,
	deleteCustomFrameMirror,
	embedCustomFramesForCards,
	getAllCustomFrames,
	getAllFrameImages,
	getCustomFrameRowById,
	getFrameImageByPayloadHash,
	getFrameImageBySourceHash,
	reconcileImportedCustomFrames,
} from "../src/apps/card-creator/persistence/custom-frames-storage.ts";
import { db } from "../src/apps/card-creator/persistence/db.ts";
import {
	ensureCustomFramesLoaded,
	getCustomFrameById,
	getCustomFramesForTypeAndStyle,
	getCustomFramesGroupedByImage,
	getCustomFramesSnapshot,
	onCustomFramesRemoved,
	reloadCustomFrames,
} from "../src/apps/card-creator/stores/custom-frames.ts";
import { sha256Hex } from "../src/apps/card-creator/utils/frame-image.ts";
import { blobToBase64 } from "../src/shared/blob.ts";
import { CardBacks } from "../src/shared/config/cards/card_backs.ts";

async function sha256HexOfText(text: string): Promise<string> {
	return sha256Hex(await new Blob([text]).arrayBuffer());
}

async function clearCustomFrames(): Promise<void> {
	await db.transaction("rw", db.customFrames, db.frameImages, async () => {
		await db.customFrames.clear();
		await db.frameImages.clear();
	});
	await reloadCustomFrames();
}

function blob(bytes: number): Blob {
	return new Blob([new Uint8Array(bytes)], { type: "image/webp" });
}

function textBlob(text: string): Blob {
	return new Blob([text], { type: "image/webp" });
}

describe("custom-frames-storage", () => {
	beforeEach(async () => {
		await clearCustomFrames();
	});

	it("allocates strictly negative, monotonically decreasing ids — never 0", async () => {
		// id 0 would serialize to `null` via `state.CardBack?.id || null` in
		// card-storage.ts (`||`, not `??`), silently losing the reference.
		const [first] = await addFrameImageAndMirrors(
			{
				payloadHash: "hash-a",
				sourceHash: "src-a",
				normVersion: 1,
				image: blob(10),
				preview: blob(2),
				byteSize: 10,
			},
			[
				{
					name: "A",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);
		const [second] = await addFrameImageAndMirrors(
			{
				payloadHash: "hash-b",
				sourceHash: "src-b",
				normVersion: 1,
				image: blob(10),
				preview: blob(2),
				byteSize: 10,
			},
			[
				{
					name: "B",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);

		expect(first.id).toBeLessThan(0);
		expect(second.id).toBeLessThan(0);
		expect(second.id).toBeLessThan(first.id);
	});

	it("one upload mirrored onto 3 stock entries costs 3 metadata rows but 1 image row", async () => {
		const mirrors = await addFrameImageAndMirrors(
			{
				payloadHash: "shared-hash",
				sourceHash: "shared-src",
				normVersion: 1,
				image: blob(500),
				preview: blob(20),
				byteSize: 500,
			},
			[
				{
					name: "Multi",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
				{
					name: "Multi",
					type: "resource",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 9,
				},
				{
					name: "Multi",
					type: "hero",
					dented: true,
					renderer: "normal_dented_hero",
					mirrorsCardBackId: 2,
				},
			],
		);

		expect(mirrors.length).toBe(3);
		expect(new Set(mirrors.map((m) => m.id)).size).toBe(3); // distinct ids
		expect((await getAllCustomFrames()).length).toBe(3);
		expect((await getAllFrameImages()).length).toBe(1);
	});

	it("reuses the existing frameImages row on a second insert with the same payloadHash", async () => {
		const image = {
			payloadHash: "dedup-hash",
			sourceHash: "dedup-src",
			normVersion: 1,
			image: blob(300),
			preview: blob(20),
			byteSize: 300,
		};
		await addFrameImageAndMirrors(image, [
			{
				name: "First",
				type: "general",
				dented: true,
				renderer: "normal_dented",
				mirrorsCardBackId: 1,
			},
		]);
		await addFrameImageAndMirrors(image, [
			{
				name: "First",
				type: "resource",
				dented: true,
				renderer: "normal_dented",
				mirrorsCardBackId: 9,
			},
		]);

		expect((await getAllFrameImages()).length).toBe(1);
		expect((await getAllCustomFrames()).length).toBe(2);
	});

	it("cascade GC: removing mirrors keeps the image until the last one is gone", async () => {
		const mirrors = await addFrameImageAndMirrors(
			{
				payloadHash: "gc-hash",
				sourceHash: "gc-src",
				normVersion: 1,
				image: blob(400),
				preview: blob(20),
				byteSize: 400,
			},
			[
				{
					name: "GC",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
				{
					name: "GC",
					type: "resource",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 9,
				},
			],
		);

		await deleteCustomFrameMirror(mirrors[0].id);
		expect(await getFrameImageByPayloadHash("gc-hash")).toBeDefined();
		expect((await getAllCustomFrames()).length).toBe(1);

		await deleteCustomFrameMirror(mirrors[1].id);
		expect(await getFrameImageByPayloadHash("gc-hash")).toBeUndefined();
		expect((await getAllCustomFrames()).length).toBe(0);
	});

	it("never reissues a deleted frame's id to a later, unrelated upload", async () => {
		// A card that still references a deleted frame's id round-trips it as a
		// `missing: true` placeholder (see card-storage.ts). That guarantee only
		// holds if the id can never be reallocated — otherwise a later upload
		// silently repoints the placeholder at unrelated pixels the moment it's
		// re-resolved, defeating the whole point of preserving the id.
		const [deleted] = await addFrameImageAndMirrors(
			{
				payloadHash: "reuse-hash-a",
				sourceHash: "reuse-src-a",
				normVersion: 1,
				image: blob(10),
				preview: blob(2),
				byteSize: 10,
			},
			[
				{
					name: "Deleted",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);
		const deletedId = deleted.id;

		// Deleting every mirror also cascade-deletes the frameImages row, so
		// nothing about "deleted" is left behind except its id having been used.
		await deleteCustomFrameMirror(deletedId);
		expect(await getCustomFrameRowById(deletedId)).toBeUndefined();

		const [unrelated] = await addFrameImageAndMirrors(
			{
				payloadHash: "reuse-hash-b",
				sourceHash: "reuse-src-b",
				normVersion: 1,
				image: blob(10),
				preview: blob(2),
				byteSize: 10,
			},
			[
				{
					name: "Unrelated",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);

		expect(unrelated.id).not.toBe(deletedId);
	});

	it("finds a frameImages row by sourceHash (the upload-time dedup identity)", async () => {
		await addFrameImageAndMirrors(
			{
				payloadHash: "src-lookup-payload",
				sourceHash: "src-lookup-source",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "X",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);

		const found = await getFrameImageBySourceHash("src-lookup-source");
		expect(found?.payloadHash).toBe("src-lookup-payload");
	});

	it("countCardsUsingFrame counts a frame used on both halves of one card without double-counting", async () => {
		const [mirror] = await addFrameImageAndMirrors(
			{
				payloadHash: "usage-hash",
				sourceHash: "usage-src",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "Usage",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);

		expect(await countCardsUsingFrame(mirror.id)).toBe(0);

		await db.cards.add({
			version: "test-card-1",
			cardName: "Test",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			preview: blob(5),
			// biome-ignore lint/suspicious/noExplicitAny: minimal fixture, not exercising the rest of SerializedCardState
			state: { CardBack: mirror.id, CardBackRight: mirror.id } as any,
		});

		expect(await countCardsUsingFrame(mirror.id)).toBe(1);
	});
});

describe("custom-frames registry", () => {
	beforeEach(async () => {
		await clearCustomFrames();
	});

	it("hydrates and resolves frames synchronously via getCustomFrameById", async () => {
		const [mirror] = await addFrameImageAndMirrors(
			{
				payloadHash: "reg-hash",
				sourceHash: "reg-src",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "Reg",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);

		expect(getCustomFrameById(mirror.id)).toBeUndefined();
		await ensureCustomFramesLoaded();
		await reloadCustomFrames();

		const resolved = getCustomFrameById(mirror.id);
		expect(resolved?.id).toBe(mirror.id);
		expect(resolved?.source).toBe("custom");
		expect(resolved?.images[0]?.objectUrl).toBeDefined();
	});

	it("notifies onCustomFramesRemoved with exactly the ids a reload dropped", async () => {
		const [mirror] = await addFrameImageAndMirrors(
			{
				payloadHash: "removed-hash",
				sourceHash: "removed-src",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "Removed",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);
		await reloadCustomFrames();
		expect(getCustomFrameById(mirror.id)).toBeDefined();

		const seen: Set<number>[] = [];
		const unsubscribe = onCustomFramesRemoved((removedIds) => {
			seen.push(new Set(removedIds));
		});
		try {
			await deleteCustomFrameMirror(mirror.id);
			await reloadCustomFrames();
		} finally {
			unsubscribe();
		}

		expect(seen.length).toBe(1);
		expect(Array.from(seen[0])).toEqual([mirror.id]);
		expect(getCustomFrameById(mirror.id)).toBeUndefined();
	});

	it("does not fire onCustomFramesRemoved when nothing was removed", async () => {
		const seen: Set<number>[] = [];
		const unsubscribe = onCustomFramesRemoved((removedIds) => {
			seen.push(new Set(removedIds));
		});
		try {
			await addFrameImageAndMirrors(
				{
					payloadHash: "no-removal-hash",
					sourceHash: "no-removal-src",
					normVersion: 1,
					image: blob(50),
					preview: blob(10),
					byteSize: 50,
				},
				[
					{
						name: "Added",
						type: "general",
						dented: true,
						renderer: "normal_dented",
						mirrorsCardBackId: 1,
					},
				],
			);
			await reloadCustomFrames();
		} finally {
			unsubscribe();
		}

		expect(seen.length).toBe(0);
	});

	it("filters by type and style, and excludes meld entirely", async () => {
		await addFrameImageAndMirrors(
			{
				payloadHash: "filter-hash",
				sourceHash: "filter-src",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "Filter",
					type: "resource",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 9,
				},
			],
		);
		await reloadCustomFrames();
		const frames = getCustomFramesSnapshot();

		expect(
			getCustomFramesForTypeAndStyle(frames, "resource", "dented").length,
		).toBe(1);
		expect(
			getCustomFramesForTypeAndStyle(frames, "resource", "flat").length,
		).toBe(0);
		expect(
			getCustomFramesForTypeAndStyle(frames, "general", "dented").length,
		).toBe(0);
		expect(
			getCustomFramesForTypeAndStyle(frames, "meld", "dented").length,
		).toBe(0);
	});

	it("groups mirrors of the same upload into one CustomFrameGroup", async () => {
		await addFrameImageAndMirrors(
			{
				payloadHash: "group-hash",
				sourceHash: "group-src",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "Group",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
				{
					name: "Group",
					type: "resource",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 9,
				},
			],
		);
		await reloadCustomFrames();

		const groups = getCustomFramesGroupedByImage(getCustomFramesSnapshot());
		expect(groups.length).toBe(1);
		expect(groups[0].mirrors.length).toBe(2);
	});

	it("reload preserves object identity and objectUrl string for unchanged rows (no revoke-race)", async () => {
		const [mirror] = await addFrameImageAndMirrors(
			{
				payloadHash: "stable-hash",
				sourceHash: "stable-src",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "Stable",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);
		await reloadCustomFrames();
		const before = getCustomFrameById(mirror.id);
		const beforeUrl = before?.images[0]?.objectUrl;

		// Add an unrelated frame and reload — the first frame's object AND its
		// objectUrl string must be unchanged, or a NormalRenderer useMemo keyed
		// on frame identity would needlessly invalidate for an unrelated change,
		// and a concurrent revoke could break a render/export in flight.
		await addFrameImageAndMirrors(
			{
				payloadHash: "other-hash",
				sourceHash: "other-src",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "Other",
					type: "resource",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 9,
				},
			],
		);
		await reloadCustomFrames();

		const after = getCustomFrameById(mirror.id);
		expect(after).toBe(before); // same object reference
		expect(after?.images[0]?.objectUrl).toBe(beforeUrl); // same URL string
	});

	it("getAvailableCardBacks merges stock and custom, stock first", async () => {
		await addFrameImageAndMirrors(
			{
				payloadHash: "merge-hash",
				sourceHash: "merge-src",
				normVersion: 1,
				image: blob(50),
				preview: blob(10),
				byteSize: 50,
			},
			[
				{
					name: "Merged",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);
		await reloadCustomFrames();

		const available = getAvailableCardBacks(
			getCustomFramesSnapshot(),
			"action",
			"dented",
		);
		const stockCount = CardBacks.filter(
			(b) => b.type === "general" && b.dented,
		).length;
		expect(available.length).toBe(stockCount + 1);
		expect(available[0]?.source).toBeUndefined(); // stock frame first
		expect(available[available.length - 1]?.source).toBe("custom");
	});
});

describe("portable export/import", () => {
	beforeEach(async () => {
		await clearCustomFrames();
	});

	it("embedCustomFramesForCards hoists a frame shared by two cards to one embedded image", async () => {
		const mirrors = await addFrameImageAndMirrors(
			{
				payloadHash: "shared-export-hash",
				sourceHash: "shared-export-src",
				normVersion: 1,
				image: blob(500),
				preview: blob(20),
				byteSize: 500,
			},
			[
				{
					name: "Shared",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
				{
					name: "Shared",
					type: "resource",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 9,
				},
			],
		);

		// Two different cards, each using a DIFFERENT mirror of the SAME image
		// (the hybrid-left/right-sharing-one-image scenario at gallery scale).
		const result = await embedCustomFramesForCards(
			[
				{ CardBack: mirrors[0].id, CardBackRight: null },
				{ CardBack: mirrors[1].id, CardBackRight: null },
			],
			true,
		);

		expect(result?.metas.length).toBe(2); // both distinct mirror rows embedded
		expect(result?.images.length).toBe(1); // but only ONE copy of the image
		expect(result?.images[0]?.payloadHash).toBe("shared-export-hash");
		expect(result?.images[0]?.image).toBeDefined(); // full-res, since includeFullResImages=true
	});

	it("embedCustomFramesForCards omits full-res image bytes when not requested (report preview embedding)", async () => {
		const [mirror] = await addFrameImageAndMirrors(
			{
				payloadHash: "preview-only-hash",
				sourceHash: "preview-only-src",
				normVersion: 1,
				image: blob(500),
				preview: blob(20),
				byteSize: 500,
			},
			[
				{
					name: "PreviewOnly",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);

		const result = await embedCustomFramesForCards(
			[{ CardBack: mirror.id, CardBackRight: null }],
			false,
		);

		expect(result?.images[0]?.image).toBeUndefined();
		expect(result?.images[0]?.preview).toBeDefined();
	});

	it("import recomputes payloadHash locally and never trusts a forged claim", async () => {
		// Local baseline: a real frame with known, real content.
		const [localMirror] = await addFrameImageAndMirrors(
			{
				payloadHash: "real-hash",
				sourceHash: "real-src",
				normVersion: 1,
				image: textBlob("real-pixels"),
				preview: textBlob("real-preview"),
				byteSize: 11,
			},
			[
				{
					name: "Real",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);

		// A crafted import claims payloadHash "real-hash" (the REAL local
		// frame's hash) but carries entirely different bytes — the attack this
		// guards against is a forged file silently repointing a local mirror
		// at different pixels while claiming to be an already-trusted hash.
		const evilBlob = textBlob("evil-pixels-not-the-real-frame");
		const evilBase64 = await blobToBase64(evilBlob);

		const idMap = await reconcileImportedCustomFrames(
			[
				{
					id: -55,
					name: "Evil",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
					payloadHash: "real-hash",
				},
			],
			[
				{
					payloadHash: "real-hash",
					image: evilBase64,
					preview: evilBase64,
					byteSize: evilBlob.size,
					sourceHash: "evil-src",
					normVersion: 1,
				},
			],
		);

		// The local "real-hash" row must be completely untouched — the forged
		// claim never got a chance to overwrite it, because reconciliation
		// keys off the RECOMPUTED hash of the received bytes, not the claim.
		const realRow = await getFrameImageByPayloadHash("real-hash");
		expect(await realRow?.image.text()).toBe("real-pixels");

		// The evil payload was still imported, but as its own, HONESTLY-hashed
		// frame — never merged with, or mistaken for, the real one.
		const resolvedId = idMap.get(-55);
		expect(resolvedId).toBeDefined();
		expect(resolvedId).not.toBe(localMirror.id);

		const newRow = await getCustomFrameRowById(resolvedId as number);
		expect(newRow?.payloadHash).not.toBe("real-hash");
		const newImageRow = await getFrameImageByPayloadHash(
			newRow?.payloadHash as string,
		);
		expect(await newImageRow?.image.text()).toBe(
			"evil-pixels-not-the-real-frame",
		);
	});

	it("import reuses an existing local mirror for the same (recomputed hash, stock entry) pair instead of duplicating it", async () => {
		// reconcileImportedCustomFrames always keys reuse off the RECOMPUTED
		// hash of the received bytes (never a claimed one, per the forged-hash
		// test above) — so the existing local row must be seeded with the
		// REAL hash of "reuse-pixels", not an arbitrary fixture string, or
		// this test would be exercising the "no match" path instead.
		const realHash = await sha256HexOfText("reuse-pixels");

		const [existing] = await addFrameImageAndMirrors(
			{
				payloadHash: realHash,
				sourceHash: "reuse-src",
				normVersion: 1,
				image: textBlob("reuse-pixels"),
				preview: textBlob("reuse-preview"),
				byteSize: 12,
			},
			[
				{
					name: "Reuse",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);

		const image = textBlob("reuse-pixels");
		const preview = textBlob("reuse-preview");
		const idMap = await reconcileImportedCustomFrames(
			[
				{
					id: -77,
					name: "Reuse",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
					// A claimed hash need not even be correct — only the FILE's own
					// meta/image pair need to agree so reconcile can link them; the
					// actual reuse decision is keyed off the recomputed hash below.
					payloadHash: "claimed-hash-doesnt-need-to-be-real",
				},
			],
			[
				{
					payloadHash: "claimed-hash-doesnt-need-to-be-real",
					image: await blobToBase64(image),
					preview: await blobToBase64(preview),
					byteSize: image.size,
					sourceHash: "reuse-src",
					normVersion: 1,
				},
			],
		);

		expect(idMap.get(-77)).toBe(existing.id);
		expect((await getAllCustomFrames()).length).toBe(1); // no duplicate mirror
		expect((await getAllFrameImages()).length).toBe(1); // no duplicate image
	});
});
