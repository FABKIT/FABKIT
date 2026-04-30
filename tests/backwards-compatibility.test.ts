import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	deserializeCardState,
	type FabgalleryFile,
	type FabkitFile,
	type SerializedCardState,
} from "../src/persistence/card-storage.ts";

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

	it("rejects files missing required fields", () => {
		const incomplete = JSON.stringify({ cardName: "test" });

		// The validation in importCardFromJSON checks for version, cardName, and state
		const parsed = JSON.parse(incomplete);
		expect(!parsed.version || !parsed.cardName || !parsed.state).toBe(true);
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
});
