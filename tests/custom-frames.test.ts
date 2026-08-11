import { beforeEach, describe, expect, it } from "bun:test";
import { getAvailableCardBacks } from "../src/apps/card-creator/config/card-backs.ts";
import {
	addFrameImageAndMirrors,
	countCardsUsingFrame,
	deleteCustomFrameMirror,
	getAllCustomFrames,
	getAllFrameImages,
	getFrameImageByPayloadHash,
	getFrameImageBySourceHash,
} from "../src/apps/card-creator/persistence/custom-frames-storage.ts";
import { db } from "../src/apps/card-creator/persistence/db.ts";
import {
	ensureCustomFramesLoaded,
	getCustomFrameById,
	getCustomFramesForTypeAndStyle,
	getCustomFramesGroupedByImage,
	reloadCustomFrames,
} from "../src/apps/card-creator/stores/custom-frames.ts";
import { CardBacks } from "../src/shared/config/cards/card_backs.ts";

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

		expect(getCustomFramesForTypeAndStyle("resource", "dented").length).toBe(1);
		expect(getCustomFramesForTypeAndStyle("resource", "flat").length).toBe(0);
		expect(getCustomFramesForTypeAndStyle("general", "dented").length).toBe(0);
		expect(getCustomFramesForTypeAndStyle("meld", "dented").length).toBe(0);
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

		const groups = getCustomFramesGroupedByImage();
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

		const available = getAvailableCardBacks("action", "dented");
		const stockCount = CardBacks.filter(
			(b) => b.type === "general" && b.dented,
		).length;
		expect(available.length).toBe(stockCount + 1);
		expect(available[0]?.source).toBeUndefined(); // stock frame first
		expect(available[available.length - 1]?.source).toBe("custom");
	});
});
