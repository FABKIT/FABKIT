import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { isFieldVisible } from "../src/apps/card-creator/components/utils.ts";
import { addFrameImageAndMirrors } from "../src/apps/card-creator/persistence/custom-frames-storage.ts";
import { db } from "../src/apps/card-creator/persistence/db.ts";
import {
	HYBRID_BLEND_DEFAULT,
	HYBRID_SPLIT_DEFAULT,
	useCardCreator,
} from "../src/apps/card-creator/stores/card-creator.ts";
import {
	getCustomFramesSnapshot,
	reloadCustomFrames,
} from "../src/apps/card-creator/stores/custom-frames.ts";
import { getArtworkUrl } from "../src/apps/card-creator/url-params/artwork.ts";
import { applyPrefillParams } from "../src/apps/card-creator/url-params/index.ts";
import {
	dismissPrefillNotice,
	dismissStalePrefillNotice,
	getPrefillNotice,
	setPrefillNotice,
} from "../src/apps/card-creator/url-params/notice.ts";
import { parsePrefillParams } from "../src/apps/card-creator/url-params/parse.ts";
import { getCardTextDoc } from "../src/apps/card-creator/url-params/text.ts";
import {
	FieldParams,
	type IgnoredParam,
} from "../src/apps/card-creator/url-params/vocabulary.ts";
import { CardStyles } from "../src/shared/config/cards/card_styles.ts";
import { type CardType, CardTypes } from "../src/shared/config/cards/types.ts";

const signal = (): AbortSignal => new AbortController().signal;

const reasonFor = (
	ignored: IgnoredParam[],
	param: string,
): string | undefined => ignored.find((entry) => entry.param === param)?.reason;

const addressableTypes = Object.keys(CardTypes).filter(
	(type) => type !== "meld",
) as CardType[];

async function clearCustomFrames(): Promise<void> {
	await db.transaction("rw", db.customFrames, db.frameImages, async () => {
		await db.customFrames.clear();
		await db.frameImages.clear();
	});
	await reloadCustomFrames();
}

beforeEach(async () => {
	await clearCustomFrames();
});

// ─── Field params ────────────────────────────────────────────────────────────

describe("field params", () => {
	it("maps every param an action card shows onto its store key", () => {
		const { patch, ignored } = parsePrefillParams({
			type: "action",
			name: "Sink Below",
			pitch: "3",
			cost: "0",
			power: "4",
			defense: "3",
			life: "2",
			class: "ninja",
			class2: "assassin",
			talent: "shadow",
			subtype: "attack",
			rarity: "majestic",
			artist: "A. Painter",
			setnumber: "wtr001",
		});

		expect(ignored).toEqual([]);
		expect(patch.CardType).toBe("action");
		expect(patch.CardName).toBe("Sink Below");
		expect(patch.CardPitch).toBe(3);
		expect(patch.CardResource).toBe("0");
		expect(patch.CardPower).toBe("4");
		expect(patch.CardDefense).toBe("3");
		expect(patch.CardLife).toBe("2");
		expect(patch.CardClass).toBe("ninja");
		expect(patch.CardSecondaryClass).toBe("assassin");
		expect(patch.CardTalent).toBe("shadow");
		expect(patch.CardSubType).toBe("attack");
		expect(patch.CardRarity).toBe("majestic");
		expect(patch.CardArtworkCredits).toBe("A. Painter");
		// setCardSetNumber uppercases, and loadCard runs no setters, so the
		// parser has to do it instead.
		expect(patch.CardSetNumber).toBe("WTR001");
	});

	it("maps the params only some card types show", () => {
		expect(
			parsePrefillParams({ type: "hero", intellect: "4" }).patch
				.CardHeroIntellect,
		).toBe("4");
		expect(
			parsePrefillParams({ type: "weapon", weapon: "2h" }).patch.CardWeapon,
		).toBe("(2H)");
		expect(
			parsePrefillParams({ type: "macro", group: "Arcane Barrier" }).patch
				.CardMacroGroup,
		).toBe("Arcane Barrier");
	});

	it("reports an unknown param name and applies the rest", () => {
		const { patch, ignored } = parsePrefillParams({
			name: "Snatch",
			colour: "red",
		});

		expect(reasonFor(ignored, "colour")).toBe("unknown_param");
		expect(patch.CardName).toBe("Snatch");
	});

	it("reports an unusable value and applies the rest", () => {
		const { patch, ignored } = parsePrefillParams({
			name: "Snatch",
			class: "ninjas",
			pitch: "7",
			rarity: "ultra",
			weapon: "3h",
			name2: "",
		});

		expect(reasonFor(ignored, "class")).toBe("invalid_value");
		expect(reasonFor(ignored, "pitch")).toBe("invalid_value");
		expect(reasonFor(ignored, "rarity")).toBe("invalid_value");
		expect(patch.CardClass).toBeUndefined();
		expect(patch.CardPitch).toBeUndefined();
		expect(patch.CardName).toBe("Snatch");
	});

	it("reports a blank value rather than writing it", () => {
		const { patch, ignored } = parsePrefillParams({ name: "   " });

		expect(reasonFor(ignored, "name")).toBe("invalid_value");
		expect(patch.CardName).toBeUndefined();
	});

	it("reports a param the chosen card type has no field for", () => {
		const { patch, ignored } = parsePrefillParams({
			type: "hero",
			pitch: "1",
			defense: "3",
			life: "20",
		});

		expect(isFieldVisible("CardPitch", "hero")).toBe(false);
		expect(reasonFor(ignored, "pitch")).toBe("not_on_card_type");
		expect(reasonFor(ignored, "defense")).toBe("not_on_card_type");
		expect(patch.CardPitch).toBeUndefined();
		expect(patch.CardLife).toBe("20");
	});

	it("gates every field param on a form field the card type actually shows", () => {
		// Guards the whole vocabulary rather than one param: anything a card type
		// has no field for must be reported, never silently written.
		for (const type of addressableTypes) {
			for (const [param, field] of Object.entries(FieldParams)) {
				const isHidden =
					field.formField !== null && !isFieldVisible(field.formField, type);

				if (isHidden) {
					const { ignored } = parsePrefillParams({ type, [param]: "1" });

					expect({ type, param, reason: reasonFor(ignored, param) }).toEqual({
						type,
						param,
						reason: "not_on_card_type",
					});
				}
			}
		}
	});
});

// ─── Card type ───────────────────────────────────────────────────────────────

describe("card type", () => {
	it("falls back to the default type when none is given", () => {
		expect(parsePrefillParams({}).patch.CardType).toBe("action");
	});

	it("rejects meld and says so", () => {
		const { patch, ignored } = parsePrefillParams({ type: "meld" });

		expect(reasonFor(ignored, "type")).toBe("invalid_value");
		expect(patch.CardType).toBe("action");
	});

	it("accepts a type case-insensitively", () => {
		expect(
			parsePrefillParams({ type: "Weapon_Equipment" }).patch.CardType,
		).toBe("weapon_equipment");
	});
});

// ─── Frames ──────────────────────────────────────────────────────────────────

describe("frames", () => {
	it("resolves the same frame and style setCardType would, for every type and style", () => {
		for (const type of addressableTypes) {
			for (const style of CardStyles) {
				useCardCreator.getState().reset();
				useCardCreator.getState().setCardBackStyle(style);
				useCardCreator.getState().setCardType(type);
				const fromStore = useCardCreator.getState();
				const { patch } = parsePrefillParams({ type, style });

				expect({
					type,
					style,
					back: patch.CardBack?.id ?? null,
					backStyle: patch.CardBackStyle,
				}).toEqual({
					type,
					style,
					back: fromStore.CardBack?.id ?? null,
					backStyle: fromStore.CardBackStyle,
				});
			}
		}
	});

	it("falls back to a style that has frames, and says so", () => {
		// weapon has no flat frames, so asking for flat lands on dented, exactly
		// as picking weapon in the form does.
		const { patch, ignored } = parsePrefillParams({
			type: "weapon",
			style: "flat",
		});

		expect(patch.CardBackStyle).toBe("dented");
		expect(patch.CardBack?.name).toBe("Weapon");
		expect(reasonFor(ignored, "style")).toBe("style_unavailable");
	});

	it("says nothing about a style the link never asked for", () => {
		const { ignored } = parsePrefillParams({ type: "weapon" });

		expect(reasonFor(ignored, "style")).toBeUndefined();
	});

	it("leaves the frame unset for a type with no frames at all", () => {
		const { patch } = parsePrefillParams({ type: "event" });

		expect(patch.CardBack).toBeNull();
	});

	it("matches a frame name case-insensitively, within the chosen type", () => {
		// Aria is both a general frame and a hero frame, so the name alone does
		// not identify one; type and style are what make it resolve.
		const asAction = parsePrefillParams({ type: "action", frame: "aRiA" });
		const asHero = parsePrefillParams({ type: "hero", frame: "aria" });

		expect(asAction.patch.CardBack?.type).toBe("general");
		expect(asHero.patch.CardBack?.type).toBe("hero");
		expect(asAction.patch.CardBack?.id).not.toBe(
			asHero.patch.CardBack?.id as number,
		);
	});

	it("reports an unresolvable frame name and falls back to the suggested frame", () => {
		const { patch, ignored } = parsePrefillParams({
			type: "action",
			frame: "Nonesuch",
		});

		expect(reasonFor(ignored, "frame")).toBe("unknown_frame");
		expect(patch.CardBack?.name).toBe("Aria");
	});

	it("never resolves a name that only a custom frame has", async () => {
		// A custom frame is a local IndexedDB row; resolving a public link against
		// one would pick up whatever the recipient uploaded under that name.
		await addFrameImageAndMirrors(
			{
				payloadHash: "prefill-hash",
				sourceHash: "prefill-src",
				normVersion: 1,
				image: new Blob([new Uint8Array(10)], { type: "image/webp" }),
				preview: new Blob([new Uint8Array(2)], { type: "image/webp" }),
				byteSize: 10,
			},
			[
				{
					name: "Smuggler",
					type: "general",
					dented: true,
					renderer: "normal_dented",
					mirrorsCardBackId: 1,
				},
			],
		);
		await reloadCustomFrames();

		expect(
			getCustomFramesSnapshot().some((frame) => frame.name === "Smuggler"),
		).toBe(true);

		const { patch, ignored } = parsePrefillParams({
			type: "action",
			frame: "Smuggler",
		});

		expect(reasonFor(ignored, "frame")).toBe("unknown_frame");
		expect(patch.CardBack?.source).toBeUndefined();
	});
});

// ─── Hybrid ──────────────────────────────────────────────────────────────────

describe("hybrid", () => {
	it("leaves the right frame null without frame2, which is what makes a card non-hybrid", () => {
		expect(
			parsePrefillParams({ type: "action" }).patch.CardBackRight,
		).toBeNull();
	});

	it("makes the card hybrid on frame2 alone", () => {
		const { patch, ignored } = parsePrefillParams({
			type: "action",
			frame2: "Aria",
		});

		expect(ignored).toEqual([]);
		expect(patch.CardBackRight?.name).toBe("Aria");
		expect(patch.CardBack?.name).toBe("Aria");
	});

	it("converts split and blend from percent to the stored fraction", () => {
		const { patch } = parsePrefillParams({
			type: "action",
			frame2: "Aria",
			split: "25",
			blend: "60",
		});

		expect(patch.CardBackSplit).toBe(0.25);
		expect(patch.CardBackBlend).toBe(0.6);
	});

	it("does not magnetise a near-centre split to dead centre", () => {
		// setCardBackSplit snaps, which exists to make dragging land on 50. A link
		// author writing 49 means 49.
		const { patch } = parsePrefillParams({
			type: "action",
			frame2: "Aria",
			split: "49",
		});

		expect(patch.CardBackSplit).toBe(0.49);
	});

	it("reports an out-of-range split or blend rather than clamping it", () => {
		const { patch, ignored } = parsePrefillParams({
			type: "action",
			frame2: "Aria",
			split: "150",
			blend: "-1",
		});

		expect(reasonFor(ignored, "split")).toBe("invalid_value");
		expect(reasonFor(ignored, "blend")).toBe("invalid_value");
		expect(patch.CardBackSplit).toBeUndefined();
		expect(patch.CardBackBlend).toBeUndefined();
	});

	it("blames only frame2 when the second frame name did not resolve", () => {
		// Two lines for one cause would send the author looking for a frame2
		// their link already has. Fixing the name is what makes split usable.
		const { patch, ignored } = parsePrefillParams({
			type: "action",
			frame2: "Nonesuch",
			split: "40",
		});

		expect(reasonFor(ignored, "frame2")).toBe("unknown_frame");
		expect(reasonFor(ignored, "split")).toBeUndefined();
		expect(patch.CardBackSplit).toBeUndefined();
	});

	it("reports split and blend on a card with no second frame", () => {
		const { patch, ignored } = parsePrefillParams({
			type: "action",
			split: "40",
			blend: "60",
		});

		expect(reasonFor(ignored, "split")).toBe("needs_second_frame");
		expect(reasonFor(ignored, "blend")).toBe("needs_second_frame");
		expect(patch.CardBackSplit).toBeUndefined();
		expect(patch.CardBackBlend).toBeUndefined();
	});

	it("leaves the store's own defaults in place when it ignores them", () => {
		const { patch } = parsePrefillParams({ type: "action", split: "40" });
		const state = { ...useCardCreator.getInitialState(), ...patch };

		expect(state.CardBackSplit).toBe(HYBRID_SPLIT_DEFAULT);
		expect(state.CardBackBlend).toBe(HYBRID_BLEND_DEFAULT);
	});
});

// ─── Card text ───────────────────────────────────────────────────────────────

describe("card text", () => {
	it("turns newlines into paragraphs", () => {
		expect(getCardTextDoc("Go again\n\nBanish it")).toEqual({
			type: "doc",
			content: [
				{ type: "paragraph", content: [{ type: "text", text: "Go again" }] },
				{ type: "paragraph" },
				{ type: "paragraph", content: [{ type: "text", text: "Banish it" }] },
			],
		});
	});

	it("turns a known shortcode into an emoji node", () => {
		expect(getCardTextDoc("Gain 1 :cost:.")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "Gain 1 " },
						{ type: "emoji", attrs: { name: "cost" } },
						{ type: "text", text: "." },
					],
				},
			],
		});
	});

	it("leaves an unknown shortcode as literal text", () => {
		expect(getCardTextDoc(":sword:")).toEqual({
			type: "doc",
			content: [
				{ type: "paragraph", content: [{ type: "text", text: ":sword:" }] },
			],
		});
	});

	it("turns the editor's own bold shorthand into a bold mark", () => {
		expect(getCardTextDoc("This gets **go again**.")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "This gets ", marks: undefined },
						{ type: "text", text: "go again", marks: [{ type: "bold" }] },
						{ type: "text", text: ".", marks: undefined },
					],
				},
			],
		});
	});

	it("accepts both bold delimiters", () => {
		const stars = getCardTextDoc("**Phantasm**");
		const underscores = getCardTextDoc("__Phantasm__");

		expect(underscores).toEqual(stars);
	});

	it("bolds around a shortcode inside the run", () => {
		expect(getCardTextDoc("**Gain :cost:**")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "Gain ", marks: [{ type: "bold" }] },
						{ type: "emoji", attrs: { name: "cost" } },
					],
				},
			],
		});
	});

	it("bolds each run when a line has more than one", () => {
		expect(getCardTextDoc("**Go again** then **Phantasm**")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "Go again", marks: [{ type: "bold" }] },
						{ type: "text", text: " then ", marks: undefined },
						{ type: "text", text: "Phantasm", marks: [{ type: "bold" }] },
					],
				},
			],
		});
	});

	it("takes a trailing space inside the run, as typing does", () => {
		// @tiptap/extension-bold guards only the opening delimiter against
		// whitespace, so this is bold in the editor and has to be bold here too.
		expect(getCardTextDoc("**go again **")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "go again ", marks: [{ type: "bold" }] },
					],
				},
			],
		});
	});

	it("gives every node in a bold run its own marks array", () => {
		// The document is persisted and exported verbatim, so shared arrays
		// would let one node's marks be mutated through another.
		const paragraph = getCardTextDoc("**a :cost: b**").content?.[0];
		const [first, , second] = paragraph?.content ?? [];

		expect(first?.marks).toEqual([{ type: "bold" }]);
		expect(second?.marks).toEqual([{ type: "bold" }]);
		expect(first?.marks).not.toBe(second?.marks);
	});

	it("leaves an unpaired delimiter literal", () => {
		expect(getCardTextDoc("Gain 2* resources **unclosed")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Gain 2* resources **unclosed",
							marks: undefined,
						},
					],
				},
			],
		});
	});

	it("leaves an underscore inside a word alone", () => {
		// The delimiter has to follow a space or start the line, same as the
		// editor's input rule, so a snake_case word is not formatting.
		expect(getCardTextDoc("snake__case__here")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "snake__case__here", marks: undefined },
					],
				},
			],
		});
	});

	it("keeps markup as visible characters", () => {
		// A link never supplies HTML: CardTextHTML reaches dangerouslySetInnerHTML,
		// so the only text that gets there is text this converter produced.
		expect(getCardTextDoc("<script>alert(1)</script>")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "<script>alert(1)</script>" }],
				},
			],
		});
	});

	it("puts the parsed document on the result", () => {
		const { textDoc } = parsePrefillParams({ text: "Go again" });

		expect(textDoc).toEqual(getCardTextDoc("Go again"));
	});
});

// ─── Artwork ─────────────────────────────────────────────────────────────────

describe("artwork", () => {
	it("accepts an https URL", () => {
		expect(getArtworkUrl("https://example.com/art.png")).toBe(
			"https://example.com/art.png",
		);
	});

	it("rejects anything that is not https", () => {
		expect(getArtworkUrl("http://example.com/art.png")).toBeNull();
		expect(getArtworkUrl("javascript:alert(1)")).toBeNull();
		expect(getArtworkUrl("data:image/png;base64,AAAA")).toBeNull();
		expect(getArtworkUrl("example.com/art.png")).toBeNull();
	});

	it("reports an unusable artwork URL", () => {
		const { artworkUrl, ignored } = parsePrefillParams({
			art: "http://example.com/art.png",
		});

		expect(artworkUrl).toBeNull();
		expect(reasonFor(ignored, "art")).toBe("invalid_value");
	});
});

// ─── Notice lifetime ─────────────────────────────────────────────────────────

describe("notice", () => {
	beforeEach(() => {
		dismissPrefillNotice();
	});

	it("survives the navigation that strips the params", () => {
		setPrefillNotice([{ param: "colour", reason: "unknown_param" }]);
		// The strip redirect re-enters the route with no params; the notice it
		// just recorded has not been seen yet.
		dismissStalePrefillNotice();

		expect(getPrefillNotice()).toHaveLength(1);
	});

	it("goes when the route is entered again without a link", () => {
		setPrefillNotice([{ param: "colour", reason: "unknown_param" }]);
		dismissStalePrefillNotice();
		dismissStalePrefillNotice();

		expect(getPrefillNotice()).toEqual([]);
	});
});

// ─── Applying ────────────────────────────────────────────────────────────────

describe("applying a link", () => {
	afterAll(() => {
		useCardCreator.getState().reset();
		dismissPrefillNotice();
	});

	it("gives the card an identity of its own", async () => {
		// SaveButton looks the open card up by __version and updates the row it
		// finds. Inheriting the initial state's id would make saving a prefilled
		// card overwrite whatever was saved earlier in the same page load.
		const before = useCardCreator.getState().__version;
		await applyPrefillParams({ type: "action", name: "First" }, signal());
		const first = useCardCreator.getState().__version;
		await applyPrefillParams({ type: "action", name: "Second" }, signal());
		const second = useCardCreator.getState().__version;

		expect(first).not.toBe(before);
		expect(second).not.toBe(first);
	});

	it("applies the patch and publishes the notice", async () => {
		await applyPrefillParams({ name: "Sink Below", colour: "red" }, signal());

		expect(useCardCreator.getState().CardName).toBe("Sink Below");
		expect(getPrefillNotice()).toEqual([
			{ param: "colour", reason: "unknown_param" },
		]);
	});
});
