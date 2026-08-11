import { beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { derivePlaceholderPresentation } from "../src/apps/card-creator/config/card-backs.ts";
import { AllRenderConfigVariations } from "../src/apps/card-creator/config/rendering.ts";
import {
	clearGallery,
	createFolder,
	deserializeCardState,
	type FabgalleryFile,
	type FabkitFile,
	getAllCards,
	getAllFolders,
	getCard,
	getFolderTree,
	importCardFromJSON,
	importGalleryFromJSON,
	type SerializedCardState,
	serializeCardState,
} from "../src/apps/card-creator/persistence/card-storage.ts";
import {
	HYBRID_BLEND_DEFAULT,
	HYBRID_SPLIT_DEFAULT,
	useCardCreator,
} from "../src/apps/card-creator/stores/card-creator.ts";
import { CardBacks } from "../src/shared/config/cards/card_backs.ts";
import { CardStyles } from "../src/shared/config/cards/card_styles.ts";
import { CardTypes } from "../src/shared/config/cards/types.ts";

const FIXTURES = join(import.meta.dir, "fixtures");

function readFixture(name: string): string {
	return readFileSync(join(FIXTURES, name), "utf-8");
}

// ─── .fabkit ─────────────────────────────────────────────────────────────────

describe(".fabkit format", () => {
	it("parses required fields", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;

		expect(file.format).toBe("fabkit");
		expect(typeof file.formatVersion).toBe("string");
		expect(typeof file.version).toBe("string");
		expect(typeof file.cardName).toBe("string");
		expect(file.state).toBeDefined();
	});

	it("deserializes card state — opening the card editor works", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const state = deserializeCardState(
			file.state as unknown as SerializedCardState,
		);

		expect(state.CardBack).not.toBeNull();
		expect(typeof state.CardBack?.id).toBe("number");
		expect(state.CardType).toBe("action");
		expect(state.CardRarity).toBe("common");
		expect(state.CardPitch).toBe(1);
		expect(state.CardName).toBe("Test Action Card");
	});

	it("preserves all scalar fields through deserialization", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const original = file.state as unknown as SerializedCardState;
		const state = deserializeCardState(original);

		expect(state.CardType).toBe(original.CardType);
		expect(state.CardName).toBe(original.CardName);
		expect(state.CardRarity).toBe(original.CardRarity);
		expect(state.CardPitch).toBe(original.CardPitch);
		expect(state.CardClass).toBe(original.CardClass);
		expect(state.CardBackStyle).toBe(original.CardBackStyle);
		expect(state.CardOverlayOpacity).toBe(original.CardOverlayOpacity);
		expect(state.meldActiveHalf).toBe(original.meldActiveHalf);
	});

	it("falls back to first card back for an unknown CardBack ID", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const stateWithUnknownBack = {
			...(file.state as unknown as SerializedCardState),
			CardBack: 999_999,
		};

		const state = deserializeCardState(stateWithUnknownBack);

		expect(state.CardBack).not.toBeNull();
		expect(typeof state.CardBack?.id).toBe("number");
	});

	// ─── Hybrid frames ───────────────────────────────────────────────────────

	it("loads an older card (no CardBackRight) as non-hybrid, not CardBacks[0]", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		// The fixture predates hybrid frames — CardBackRight is absent, not null.
		const legacyState = file.state as unknown as SerializedCardState;
		expect("CardBackRight" in legacyState).toBe(false);

		const state = deserializeCardState(legacyState);

		// Must be null, never CardBacks[0] — the fallback used for the left
		// frame would silently turn every pre-existing card into a hybrid.
		expect(state.CardBackRight).toBeNull();
	});

	it("round-trips a hybrid card's right frame through serialize/deserialize", () => {
		const rightFrame = CardBacks.find(
			(back) => back.type === "general" && back.dented,
		);
		expect(rightFrame).toBeDefined();

		const state = {
			...useCardCreator.getState(),
			CardBackRight: rightFrame,
		};
		const serialized = serializeCardState(state);
		expect(serialized.CardBackRight).toBe(rightFrame?.id ?? null);

		const deserialized = deserializeCardState(serialized);
		expect(deserialized.CardBackRight?.id).toBe(rightFrame?.id);
	});

	it("round-trips a non-hybrid card's null right frame", () => {
		const state = {
			...useCardCreator.getState(),
			CardBackRight: null,
		};
		const serialized = serializeCardState(state);
		expect(serialized.CardBackRight).toBeNull();

		const deserialized = deserializeCardState(serialized);
		expect(deserialized.CardBackRight).toBeNull();
	});

	it("falls back to default seam settings when a record predates them", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const legacyState = file.state as unknown as SerializedCardState;
		expect("CardBackSplit" in legacyState).toBe(false);
		expect("CardBackBlend" in legacyState).toBe(false);

		const state = deserializeCardState(legacyState);

		// Must be real numbers — undefined here would NaN the gradient maths
		// and blank the card back entirely.
		expect(state.CardBackSplit).toBe(HYBRID_SPLIT_DEFAULT);
		expect(state.CardBackBlend).toBe(HYBRID_BLEND_DEFAULT);
	});

	it("round-trips custom seam position and softness", () => {
		const state = {
			...useCardCreator.getState(),
			CardBackSplit: 0.37,
			CardBackBlend: 0.62,
		};
		const serialized = serializeCardState(state);
		expect(serialized.CardBackSplit).toBe(0.37);
		expect(serialized.CardBackBlend).toBe(0.62);

		const deserialized = deserializeCardState(serialized);
		expect(deserialized.CardBackSplit).toBe(0.37);
		expect(deserialized.CardBackBlend).toBe(0.62);
	});

	it("clears CardBackRight on load for meld cards, even if the record carries one", () => {
		const rightFrame = CardBacks.find((back) => back.type === "general");
		const staleMeldState = {
			...(JSON.parse(readFixture("sample.fabkit"))
				.state as SerializedCardState),
			CardType: "meld" as const,
			CardBackRight: rightFrame?.id ?? null,
		};

		const state = deserializeCardState(staleMeldState);

		expect(state.CardBackRight).toBeNull();
	});

	it("rejects files missing required fields", () => {
		const incomplete = JSON.stringify({ cardName: "test" });

		// The validation in importCardFromJSON checks for version, cardName, and state
		const parsed = JSON.parse(incomplete);
		expect(!parsed.version || !parsed.cardName || !parsed.state).toBe(true);
	});

	it("has no folderId field — legacy files predate folders", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;

		expect((file as Record<string, unknown>).folderId).toBeUndefined();
	});

	it("imports to gallery root — cards with no folderId land at root", async () => {
		await clearGallery();
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;

		await importCardFromJSON(JSON.stringify(file));
		const stored = await getCard(file.version);

		expect(stored).not.toBeNull();
		expect(stored?.folderId).toBeUndefined();
	});
});

// ─── .fabreport ──────────────────────────────────────────────────────────────

describe(".fabreport format", () => {
	it("parses meta section", () => {
		const report = JSON.parse(readFixture("sample.fabreport"));

		expect(report.meta).toBeDefined();
		expect(typeof report.meta.appVersion).toBe("string");
		expect(typeof report.meta.timestamp).toBe("string");
		expect(typeof report.meta.url).toBe("string");
		expect(Array.isArray(report.meta.router.matches)).toBe(true);
	});

	it("parses user section", () => {
		const report = JSON.parse(readFixture("sample.fabreport"));

		expect(report.user).toBeDefined();
		expect(typeof report.user.whatBroke).toBe("string");
	});

	it("parses console entries", () => {
		const report = JSON.parse(readFixture("sample.fabreport"));

		expect(Array.isArray(report.console)).toBe(true);
		const entry = report.console[0];
		expect(["error", "warn", "unhandled"]).toContain(entry.level);
		expect(typeof entry.message).toBe("string");
		expect(typeof entry.timestamp).toBe("number");
	});

	it("loads gallery from embedded FabgalleryFile — loading gallery works", () => {
		const report = JSON.parse(readFixture("sample.fabreport"));
		const gallery = report.gallery;

		expect(gallery).toBeDefined();

		if (Array.isArray(gallery)) {
			// Legacy format: raw card array
			for (const card of gallery) {
				expect(typeof card.version).toBe("string");
			}
		} else {
			// Current format: FabgalleryFile wrapper
			const typed = gallery as FabgalleryFile;
			expect(typed.format).toBe("fabgallery");
			expect(Array.isArray(typed.cards)).toBe(true);
			expect(typed.cardCount).toBe(typed.cards.length);

			for (const card of typed.cards) {
				expect(card.format).toBe("fabkit");
				expect(typeof card.version).toBe("string");
				expect(card.state).toBeDefined();
			}
		}
	});

	it("restores card editor state from store field — opening the card editor works", () => {
		const report = JSON.parse(readFixture("sample.fabreport"));
		const raw = report.store as Record<string, unknown>;

		expect(raw).toBeDefined();

		// In a fabreport, store.CardBack is the full CardBack object (not just an ID).
		// Normalize to a SerializedCardState for deserialization.
		const cardBackRaw = raw.CardBack as { id?: number } | number | null;
		const cardBackId =
			cardBackRaw === null
				? null
				: typeof cardBackRaw === "number"
					? cardBackRaw
					: (cardBackRaw?.id ?? null);

		const serialized: SerializedCardState = {
			...(raw as Omit<SerializedCardState, "CardBack">),
			CardBack: cardBackId,
		};

		const state = deserializeCardState(serialized);

		expect(state.CardBack).not.toBeNull();
		expect(typeof state.CardBack?.id).toBe("number");
		expect(state.CardName).toBe("Store Card");
	});

	it("deserializes every card in the embedded gallery", () => {
		const report = JSON.parse(readFixture("sample.fabreport"));
		const gallery = report.gallery as FabgalleryFile;

		expect(gallery.format).toBe("fabgallery");

		for (const card of gallery.cards) {
			const state = deserializeCardState(
				card.state as unknown as SerializedCardState,
			);
			expect(state.CardBack).not.toBeNull();
			expect(state.CardType).toBeDefined();
		}
	});

	it("imports the embedded gallery to gallery root — no folderId on legacy cards", async () => {
		await clearGallery();
		const report = JSON.parse(readFixture("sample.fabreport"));
		const gallery = report.gallery as FabgalleryFile;
		expect(gallery.format).toBe("fabgallery");
		expect((gallery as Record<string, unknown>).folders).toBeUndefined();

		await importGalleryFromJSON(JSON.stringify(gallery), "replace");
		const stored = await getAllCards();

		expect(stored.length).toBe(gallery.cards.length);
		for (const card of stored) {
			expect(card.folderId).toBeUndefined();
		}
	});
});

// ─── .fabgallery folders ───────────────────────────────────────────────────────

describe(".fabgallery folders", () => {
	beforeEach(async () => {
		await clearGallery();
	});

	it("old-format .fabgallery with no folders key imports all cards to root", async () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const legacyGallery = {
			format: "fabgallery",
			formatVersion: "0.0.0-test",
			exportedAt: new Date().toISOString(),
			cardCount: 1,
			cards: [{ ...file }],
			// no `folders` key at all — pre-folders export
		};
		expect("folders" in legacyGallery).toBe(false);

		const result = await importGalleryFromJSON(
			JSON.stringify(legacyGallery),
			"replace",
		);

		expect(result.imported).toBe(1);
		expect(result.foldersCreated).toBe(0);
		const cards = await getAllCards();
		expect(cards.length).toBe(1);
		expect(cards[0]?.folderId).toBeUndefined();
		expect(await getAllFolders()).toEqual([]);
	});

	it("round-trips a folder tree through replace-mode import, preserving tree shape", async () => {
		const gallery = JSON.parse(
			readFixture("sample-with-folders.fabgallery"),
		) as FabgalleryFile;

		await importGalleryFromJSON(JSON.stringify(gallery), "replace");

		const tree = await getFolderTree();
		expect(tree.length).toBe(1);
		expect(tree[0]?.name).toBe("Heroes");
		expect(tree[0]?.children.length).toBe(1);
		expect(tree[0]?.children[0]?.name).toBe("Legends");

		const cards = await getAllCards();
		expect(cards.length).toBe(3);
		const byName = new Map(cards.map((c) => [c.cardName, c]));
		expect(byName.get("Root Card")?.folderId).toBeUndefined();

		const heroesId = tree[0]?.id;
		const legendsId = tree[0]?.children[0]?.id;
		expect(byName.get("Heroes Card")?.folderId).toBe(heroesId as string);
		expect(byName.get("Legends Card")?.folderId).toBe(legendsId as string);
	});

	it("round-trips a folder tree through merge-mode import, reusing folders by (parentId, name)", async () => {
		const gallery = JSON.parse(
			readFixture("sample-with-folders.fabgallery"),
		) as FabgalleryFile;

		// First import establishes the local folder tree + cards.
		const first = await importGalleryFromJSON(JSON.stringify(gallery), "merge");
		expect(first.imported).toBe(3);
		expect(first.foldersCreated).toBe(2);
		expect(first.foldersMerged).toBe(0);

		const treeAfterFirst = await getFolderTree();
		expect(treeAfterFirst.length).toBe(1);
		const heroesIdAfterFirst = treeAfterFirst[0]?.id;
		const legendsIdAfterFirst = treeAfterFirst[0]?.children[0]?.id;

		// Second merge-import of the same gallery: same card versions are skipped
		// (already present), but folders should be reconciled by name, not duplicated.
		const second = await importGalleryFromJSON(
			JSON.stringify(gallery),
			"merge",
		);
		expect(second.imported).toBe(0);
		expect(second.skipped).toBe(3);
		expect(second.foldersCreated).toBe(0);
		expect(second.foldersMerged).toBe(2);

		const treeAfterSecond = await getFolderTree();
		expect(treeAfterSecond.length).toBe(1);
		expect(treeAfterSecond[0]?.id).toBe(heroesIdAfterFirst as string);
		expect(treeAfterSecond[0]?.children.length).toBe(1);
		expect(treeAfterSecond[0]?.children[0]?.id).toBe(
			legendsIdAfterFirst as string,
		);

		// No duplicate folders were created by the second merge.
		expect((await getAllFolders()).length).toBe(2);
	});

	it("merge-mode creates only the folders that don't already exist locally by name", async () => {
		// Pre-seed a local "Heroes" root folder before merging in a gallery that
		// also has a root "Heroes" folder plus a new "Legends" child.
		const existingHeroes = await createFolder("Heroes");

		const gallery = JSON.parse(
			readFixture("sample-with-folders.fabgallery"),
		) as FabgalleryFile;

		const result = await importGalleryFromJSON(
			JSON.stringify(gallery),
			"merge",
		);

		expect(result.foldersMerged).toBe(1); // reused existing "Heroes"
		expect(result.foldersCreated).toBe(1); // created "Legends" under it

		const tree = await getFolderTree();
		expect(tree.length).toBe(1);
		expect(tree[0]?.id).toBe(existingHeroes.id);
		expect(tree[0]?.children.length).toBe(1);
		expect(tree[0]?.children[0]?.name).toBe("Legends");
	});
});

// ─── Custom-frame missing-frame placeholder ────────────────────────────────
//
// Custom (user-uploaded) frames are represented as CardBacks with negative
// ids. When a negative id can't be resolved locally (frame deleted, not yet
// imported, cross-tab race), deserializeCardState must NOT fall back to
// CardBacks[0] the way it does for an unresolvable positive id — a save
// writes `state.CardBack?.id` straight back to storage, so that fallback
// would permanently destroy the reference on the very next save. Instead it
// produces a `missing: true` placeholder that preserves the original id.

describe("custom-frame missing-frame placeholder", () => {
	it("still resolves an unknown POSITIVE CardBack id to CardBacks[0] (unchanged by sign discrimination)", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const state = deserializeCardState({
			...(file.state as unknown as SerializedCardState),
			CardBack: 999_999,
		});

		expect(state.CardBack?.id).toBe(CardBacks[0].id);
		expect(state.CardBack?.missing).toBeUndefined();
	});

	it("resolves an unresolvable NEGATIVE CardBack id to a missing placeholder, preserving the id", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const state = deserializeCardState({
			...(file.state as unknown as SerializedCardState),
			CardBack: -3,
		});

		expect(state.CardBack?.id).toBe(-3);
		expect(state.CardBack?.missing).toBe(true);
	});

	it("round-trips a missing-frame placeholder through serialize/deserialize with the id unchanged", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const deserialized = deserializeCardState({
			...(file.state as unknown as SerializedCardState),
			CardBack: -3,
		});

		const serialized = serializeCardState({
			...useCardCreator.getState(),
			...deserialized,
		});
		// Must round-trip untouched — this is the core fix: a routine save can
		// no longer clobber the reference with a stock frame id.
		expect(serialized.CardBack).toBe(-3);

		const reDeserialized = deserializeCardState(serialized);
		expect(reDeserialized.CardBack?.id).toBe(-3);
		expect(reDeserialized.CardBack?.missing).toBe(true);
	});

	it("resolves an unresolvable NEGATIVE CardBackRight id to a missing placeholder, keeping the card hybrid", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const state = deserializeCardState({
			...(file.state as unknown as SerializedCardState),
			CardType: "action",
			CardBackRight: -7,
		});

		expect(state.CardBackRight?.id).toBe(-7);
		expect(state.CardBackRight?.missing).toBe(true);
	});

	it("still clears CardBackRight on load for meld cards, even when it's an unresolved custom id", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const state = deserializeCardState({
			...(file.state as unknown as SerializedCardState),
			CardType: "meld",
			CardBackRight: -7,
		});

		expect(state.CardBackRight).toBeNull();
	});

	it("derives a resolvable renderer for the placeholder across every card type and style", () => {
		// getCardBacksForTypeAndStyle returns an empty list for event/dented,
		// event/flat, weapon/flat and weapon_equipment/flat — derivation must
		// hard-default rather than leave the renderer unset, or the card would
		// render nothing at all instead of the placeholder image.
		for (const cardType of Object.keys(
			CardTypes,
		) as (keyof typeof CardTypes)[]) {
			for (const style of CardStyles) {
				const { renderer } = derivePlaceholderPresentation(cardType, style);
				expect(AllRenderConfigVariations[renderer]).toBeDefined();
			}
		}
	});

	it("setCardType preserves a missing CardBack placeholder's id across a type change", () => {
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const deserialized = deserializeCardState({
			...(file.state as unknown as SerializedCardState),
			CardBack: -3,
		});
		useCardCreator.setState({ ...useCardCreator.getState(), ...deserialized });
		expect(useCardCreator.getState().CardBack?.id).toBe(-3);

		useCardCreator.getState().setCardType("hero");

		expect(useCardCreator.getState().CardBack?.id).toBe(-3);
		expect(useCardCreator.getState().CardBack?.missing).toBe(true);
	});

	it("setCardBackStyle preserves a missing CardBack placeholder's id across a style change", () => {
		// setCardBackStyle used to have NO validity check at all and
		// unconditionally replaced CardBack — the highest-risk site for this bug.
		const file = JSON.parse(readFixture("sample.fabkit")) as FabkitFile;
		const deserialized = deserializeCardState({
			...(file.state as unknown as SerializedCardState),
			CardBack: -3,
			CardBackStyle: "dented" as const,
		});
		useCardCreator.setState({ ...useCardCreator.getState(), ...deserialized });
		expect(useCardCreator.getState().CardBack?.id).toBe(-3);

		useCardCreator.getState().setCardBackStyle("flat");

		expect(useCardCreator.getState().CardBack?.id).toBe(-3);
		expect(useCardCreator.getState().CardBack?.missing).toBe(true);
	});
});
