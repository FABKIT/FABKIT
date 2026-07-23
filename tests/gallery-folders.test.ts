import { beforeEach, describe, expect, it } from "bun:test";
import {
	clearGallery,
	createFolder,
	deleteFolder,
	type FabkitFile,
	getAllFolders,
	getCardsInFolder,
	getFolderContentsCount,
	getFolderTree,
	importCardFromObject,
	moveCardToFolder,
	moveFolder,
	renameFolder,
} from "../src/apps/card-creator/persistence/card-storage.ts";

// A minimal, valid FabkitFile used to seed cards in the DB for folder tests.
// Card content itself is irrelevant here — only version/cardName/folderId matter.
function makeCardFile(version: string, cardName: string): FabkitFile {
	return {
		format: "fabkit",
		formatVersion: "0.0.0-test",
		version,
		cardName,
		createdAt: 1746000000000,
		updatedAt: 1746000000000,
		preview:
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
		state: {
			__version: version,
			CardType: "action",
			CardBack: 1,
			CardBackStyle: "dented",
			CardArtwork: null,
			CardArtPosition: null,
			CardArtworkCredits: null,
			CardSetNumber: null,
			CardTextHTML: null,
			CardTextNode: null,
			CardPitch: 1,
			CardName: cardName,
			CardResource: null,
			CardText: null,
			CardPower: null,
			CardTalent: null,
			CardClass: null,
			CardSecondaryClass: null,
			CardSubType: null,
			CardRarity: "common",
			CardDefense: null,
			CardLife: null,
			CardHeroIntellect: null,
			CardWeapon: null,
			CardMacroGroup: null,
			CardOverlay: null,
			CardOverlayOpacity: 1,
			meldActiveHalf: "A",
			meldHalfA: {
				CardType: "action",
				CardName: null,
				CardArtwork: null,
				CardArtPosition: null,
				CardClass: null,
				CardSecondaryClass: null,
				CardSubType: null,
				CardTalent: null,
				CardTextHTML: null,
				CardTextNode: null,
				CardMacroGroup: null,
				CardWeapon: null,
			},
			meldHalfB: {
				CardType: "action",
				CardName: null,
				CardArtwork: null,
				CardArtPosition: null,
				CardClass: null,
				CardSecondaryClass: null,
				CardSubType: null,
				CardTalent: null,
				CardTextHTML: null,
				CardTextNode: null,
				CardMacroGroup: null,
				CardWeapon: null,
			},
		},
	} as unknown as FabkitFile;
}

async function addCard(version: string, cardName: string): Promise<void> {
	await importCardFromObject(makeCardFile(version, cardName));
}

beforeEach(async () => {
	await clearGallery();
});

// ─── getFolderTree assembly ─────────────────────────────────────────────────────

describe("getFolderTree", () => {
	it("assembles multiple roots with nested children", async () => {
		const rootA = await createFolder("Root A");
		const rootB = await createFolder("Root B");
		await createFolder("Child of A", rootA.id);

		const tree = await getFolderTree();

		expect(tree.length).toBe(2);
		const byName = new Map(tree.map((n) => [n.name, n]));
		expect(byName.get("Root A")?.children.length).toBe(1);
		expect(byName.get("Root A")?.children[0]?.name).toBe("Child of A");
		expect(byName.get("Root B")?.children.length).toBe(0);
	});

	it("treats a dangling/unresolved parentId as root instead of dropping the folder", async () => {
		const orphan = await createFolder("Orphan", "does-not-exist");

		const tree = await getFolderTree();

		expect(tree.some((n) => n.id === orphan.id)).toBe(true);
		const node = tree.find((n) => n.id === orphan.id);
		expect(node?.children.length).toBe(0);
	});
});

// ─── Name validation ─────────────────────────────────────────────────────────────

describe("folder name validation", () => {
	it("rejects names longer than 20 characters", async () => {
		const tooLong = "a".repeat(21);
		await expect(createFolder(tooLong)).rejects.toThrow();
	});

	it("allows names up to 20 characters", async () => {
		const exactly20 = "a".repeat(20);
		const folder = await createFolder(exactly20);
		expect(folder.name).toBe(exactly20);
	});

	it("rejects a duplicate name among siblings", async () => {
		await createFolder("Same");
		await expect(createFolder("Same")).rejects.toThrow();
	});

	it("allows the same name under different parents", async () => {
		const parentA = await createFolder("Parent A");
		const parentB = await createFolder("Parent B");

		await createFolder("Same", parentA.id);
		const second = await createFolder("Same", parentB.id);

		expect(second.name).toBe("Same");
	});

	it("rejects a rename that collides with a sibling", async () => {
		await createFolder("Taken");
		const other = await createFolder("Other");

		await expect(renameFolder(other.id, "Taken")).rejects.toThrow();
	});

	it("rejects a move that collides with a sibling name at the destination", async () => {
		const dest = await createFolder("Destination");
		await createFolder("Conflict", dest.id);
		const mover = await createFolder("Conflict");

		await expect(moveFolder(mover.id, dest.id)).rejects.toThrow();
	});
});

// ─── Depth validation ─────────────────────────────────────────────────────────────

describe("folder depth validation", () => {
	it("allows nesting to depth 5", async () => {
		let parentId: string | undefined;
		for (let depth = 1; depth <= 5; depth++) {
			const folder = await createFolder(`Level ${depth}`, parentId);
			expect(folder.name).toBe(`Level ${depth}`);
			parentId = folder.id;
		}
	});

	it("rejects nesting to depth 6", async () => {
		let parentId: string | undefined;
		for (let depth = 1; depth <= 5; depth++) {
			const folder = await createFolder(`Level ${depth}`, parentId);
			parentId = folder.id;
		}
		await expect(createFolder("Level 6", parentId)).rejects.toThrow();
	});

	it("rejects moving a folder with a subtree past the depth cap (subtree-height aware)", async () => {
		// f1 -> f2 -> f3 -> f4 (f3 has a child f4, so f3's subtree height is 1).
		const f1 = await createFolder("f1");
		const f2 = await createFolder("f2", f1.id);
		const f3 = await createFolder("f3", f2.id);
		await createFolder("f4", f3.id);

		// g1 -> g2 -> g3 -> g4 (depth 4). Moving f3 (subtree height 1) under g4
		// would put f3 at depth 5 and f4 at depth 6 — over the cap.
		const g1 = await createFolder("g1");
		const g2 = await createFolder("g2", g1.id);
		const g3 = await createFolder("g3", g2.id);
		const g4 = await createFolder("g4", g3.id);

		await expect(moveFolder(f3.id, g4.id)).rejects.toThrow();
	});

	it("allows moving a folder with a subtree when it still fits within the depth cap", async () => {
		const f1 = await createFolder("f1");
		const f2 = await createFolder("f2", f1.id);
		await createFolder("f4", f2.id); // f2's subtree height is 1

		const g1 = await createFolder("g1");
		const g2 = await createFolder("g2", g1.id);
		const g3 = await createFolder("g3", g2.id);

		// g3 is at depth 3; moving f2 (subtree height 1) under g3 puts f2 at depth
		// 4 and its child at depth 5 — exactly at the cap, should succeed.
		await moveFolder(f2.id, g3.id);

		const tree = await getFolderTree();
		const rootG1 = tree.find((n) => n.id === g1.id);
		const movedF2 = rootG1?.children[0]?.children[0]?.children[0];
		expect(movedF2?.id).toBe(f2.id);
		expect(movedF2?.children.length).toBe(1);
	});
});

// ─── moveFolder cycle rejection ─────────────────────────────────────────────────

describe("moveFolder cycle rejection", () => {
	it("rejects moving a folder into itself", async () => {
		const folder = await createFolder("Self");
		await expect(moveFolder(folder.id, folder.id)).rejects.toThrow();
	});

	it("rejects moving a folder into its direct descendant", async () => {
		const parent = await createFolder("Parent");
		const child = await createFolder("Child", parent.id);

		await expect(moveFolder(parent.id, child.id)).rejects.toThrow();
	});

	it("rejects moving a folder into a deep descendant", async () => {
		const p = await createFolder("P");
		const c1 = await createFolder("C1", p.id);
		const c2 = await createFolder("C2", c1.id);

		await expect(moveFolder(p.id, c2.id)).rejects.toThrow();
	});
});

// ─── deleteFolder cascade ───────────────────────────────────────────────────────

describe("deleteFolder cascade", () => {
	it("reports the correct total count and removes all descendant folders + cards", async () => {
		const root = await createFolder("Root");
		const child = await createFolder("Child", root.id);
		const grandchild = await createFolder("Grandchild", child.id);

		await addCard("card-1", "Card 1");
		await moveCardToFolder("card-1", root.id);
		await addCard("card-2", "Card 2");
		await moveCardToFolder("card-2", child.id);
		await addCard("card-3", "Card 3");
		await moveCardToFolder("card-3", grandchild.id);
		await addCard("card-root", "Root-level card"); // not touched

		// 2 descendant folders (child, grandchild) + 3 cards = 5.
		const count = await getFolderContentsCount(root.id);
		expect(count).toBe(5);

		await deleteFolder(root.id);

		const remainingFolders = await getAllFolders();
		expect(remainingFolders.length).toBe(0);

		const rootCards = await getCardsInFolder(undefined);
		expect(rootCards.map((c) => c.version)).toEqual(["card-root"]);

		// No orphaned cards left pointing at deleted folder ids.
		expect(await getCardsInFolder(root.id)).toEqual([]);
		expect(await getCardsInFolder(child.id)).toEqual([]);
		expect(await getCardsInFolder(grandchild.id)).toEqual([]);
	});
});

// ─── moveCardToFolder / getCardsInFolder root filter ───────────────────────────

describe("moveCardToFolder and getCardsInFolder(root)", () => {
	it("filters strictly on folderId being absent for the root case", async () => {
		const folder = await createFolder("Folder");
		await addCard("root-card", "Root Card");
		await addCard("folder-card", "Folder Card");
		await moveCardToFolder("folder-card", folder.id);

		const rootCards = await getCardsInFolder(undefined);
		expect(rootCards.map((c) => c.version)).toEqual(["root-card"]);

		const folderCards = await getCardsInFolder(folder.id);
		expect(folderCards.map((c) => c.version)).toEqual(["folder-card"]);
	});

	it("moving a card back out of a folder (folderId undefined) returns it to root", async () => {
		const folder = await createFolder("Folder");
		await addCard("card", "Card");
		await moveCardToFolder("card", folder.id);
		expect((await getCardsInFolder(undefined)).length).toBe(0);

		await moveCardToFolder("card", undefined);

		const rootCards = await getCardsInFolder(undefined);
		expect(rootCards.map((c) => c.version)).toEqual(["card"]);
		expect((await getCardsInFolder(folder.id)).length).toBe(0);
	});
});
