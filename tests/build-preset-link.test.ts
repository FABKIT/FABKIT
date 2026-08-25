import { beforeEach, describe, expect, it } from "bun:test";
import type { CardCreatorCardBack } from "../src/apps/card-creator/config/rendering.ts";
import {
	buildPresetLinkPayload,
	buildPresetLinkUrl,
	hasUnshareableCardBack,
} from "../src/apps/card-creator/preset-link/build-preset-link.ts";
import { loadPresetLink } from "../src/apps/card-creator/preset-link/preset-link.ts";
import {
	defaultMeldHalf,
	useCardCreator,
} from "../src/apps/card-creator/stores/card-creator.ts";
import { CardBacks } from "../src/shared/config/cards/card_backs.ts";

const stockCardBack: CardCreatorCardBack = {
	...CardBacks[0],
	renderer: "normal_dented",
};

const customCardBack: CardCreatorCardBack = {
	id: -1,
	name: "My Custom Frame",
	type: "general",
	dented: true,
	source: "custom",
	images: [],
	renderer: "normal_dented",
};

beforeEach(() => {
	useCardCreator.getState().reset();
});

describe("buildPresetLinkPayload", () => {
	it("includes only the fields that are actually set", () => {
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardName).toBeUndefined();
		expect(state.CardText).toBeUndefined();
	});

	it("carries over set scalar fields", () => {
		useCardCreator.setState({
			CardType: "action",
			CardName: "Rolling Thunder",
			CardPitch: 2,
			CardClass: "ranger",
			CardTalent: "lightning",
			CardRarity: "rare",
		});
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardType).toBe("action");
		expect(state.CardName).toBe("Rolling Thunder");
		expect(state.CardPitch).toBe(2);
		expect(state.CardClass).toBe("ranger");
		expect(state.CardTalent).toBe("lightning");
		expect(state.CardRarity).toBe("rare");
	});

	it("always includes CardBackStyle/CardBackSplit/CardBackBlend — they're never unset", () => {
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardBackStyle).toBeDefined();
		expect(typeof state.CardBackSplit).toBe("number");
		expect(typeof state.CardBackBlend).toBe("number");
	});

	it("includes a stock CardBack as { id }", () => {
		useCardCreator.setState({ CardBack: stockCardBack });
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardBack).toEqual({ id: stockCardBack.id });
	});

	it("omits a custom CardBack — not representable in the wire format", () => {
		useCardCreator.setState({ CardBack: customCardBack });
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardBack).toBeUndefined();
	});

	it("round-trips plain CardText", () => {
		useCardCreator.getState().setCardText("Deal 3 damage.", {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "Deal 3 damage." }],
				},
			],
		});
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardText).toBe("Deal 3 damage.");
	});

	it("round-trips bold/underline marks and hardBreak/emoji nodes back to restricted markup", () => {
		useCardCreator.getState().setCardText("ignored", {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "Gets ", marks: [] },
						{ type: "text", text: "Dominate", marks: [{ type: "bold" }] },
						{ type: "text", text: ".", marks: [] },
						{ type: "hardBreak" },
						{ type: "text", text: "Then ", marks: [] },
						{
							type: "text",
							text: "go again",
							marks: [{ type: "underline" }],
						},
						{ type: "text", text: " for " },
						{ type: "emoji", attrs: { name: "power" } },
						{ type: "text", text: "." },
					],
				},
			],
		});
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardText).toBe(
			"Gets **Dominate**.\nThen __go again__ for :power:.",
		);
	});

	it("joins separate paragraphs with a blank line", () => {
		useCardCreator.getState().setCardText("ignored", {
			type: "doc",
			content: [
				{ type: "paragraph", content: [{ type: "text", text: "First." }] },
				{ type: "paragraph", content: [{ type: "text", text: "Second." }] },
			],
		});
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardText).toBe("First.\n\nSecond.");
	});

	it("degrades unsupported formatting (e.g. a bullet list) to its plain text rather than dropping it", () => {
		useCardCreator.getState().setCardText("ignored", {
			type: "doc",
			content: [
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "First point" }],
								},
							],
						},
					],
				},
			],
		});
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.CardText).toBe("First point");
	});

	it("omits meld half data for a non-meld card", () => {
		useCardCreator.setState({
			meldHalfA: { ...defaultMeldHalf, CardName: "Heads" },
		});
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.meldHalfA).toBeUndefined();
		expect(state.meldActiveHalf).toBeUndefined();
	});

	it("includes meld half data for a meld card", () => {
		useCardCreator.setState({
			CardType: "meld",
			meldHalfA: { ...defaultMeldHalf, CardName: "Heads", CardType: "action" },
			meldHalfB: { ...defaultMeldHalf, CardName: "Tails", CardType: "action" },
		});
		const state = buildPresetLinkPayload(useCardCreator.getState());
		expect(state.meldActiveHalf).toBe("A");
		expect(state.meldHalfA).toEqual({ CardName: "Heads", CardType: "action" });
		expect(state.meldHalfB).toEqual({ CardName: "Tails", CardType: "action" });
	});
});

describe("hasUnshareableCardBack", () => {
	it("is false for a stock card back", () => {
		useCardCreator.setState({ CardBack: stockCardBack, CardBackRight: null });
		expect(hasUnshareableCardBack(useCardCreator.getState())).toBe(false);
	});

	it("is true when CardBack is a custom frame", () => {
		useCardCreator.setState({ CardBack: customCardBack });
		expect(hasUnshareableCardBack(useCardCreator.getState())).toBe(true);
	});

	it("is true when CardBackRight is a custom frame", () => {
		useCardCreator.setState({ CardBackRight: customCardBack });
		expect(hasUnshareableCardBack(useCardCreator.getState())).toBe(true);
	});
});

describe("buildPresetLinkUrl", () => {
	it("builds a /#/preset?link= URL against the given base", () => {
		useCardCreator.setState({ CardName: "Rolling Thunder" });
		const url = buildPresetLinkUrl(
			useCardCreator.getState(),
			"https://fabkit.io/",
		);
		expect(url.startsWith("https://fabkit.io/#/preset?link=")).toBe(true);
		const encoded = url.split("link=")[1];
		const payload = JSON.parse(decodeURIComponent(encoded));
		expect(payload.CardName).toBe("Rolling Thunder");
	});
});

describe("round trip through loadPresetLink", () => {
	it("a link built from the current form reopens the same data", () => {
		useCardCreator.setState({
			CardType: "action",
			CardName: "Rolling Thunder",
			CardPitch: 2,
			CardResource: "1",
			CardPower: "3",
			CardClass: "ranger",
			CardTalent: "lightning",
			CardRarity: "rare",
			CardBack: stockCardBack,
		});
		useCardCreator.getState().setCardText("ignored", {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "Gets " },
						{ type: "text", text: "Dominate", marks: [{ type: "bold" }] },
						{ type: "text", text: "." },
					],
				},
			],
		});

		const payload = buildPresetLinkPayload(useCardCreator.getState());
		useCardCreator.getState().reset();
		loadPresetLink(payload);

		const reopened = useCardCreator.getState();
		expect(reopened.CardType).toBe("action");
		expect(reopened.CardName).toBe("Rolling Thunder");
		expect(reopened.CardPitch).toBe(2);
		expect(reopened.CardResource).toBe("1");
		expect(reopened.CardPower).toBe("3");
		expect(reopened.CardClass).toBe("ranger");
		expect(reopened.CardTalent).toBe("lightning");
		expect(reopened.CardRarity).toBe("rare");
		expect(reopened.CardBack?.id).toBe(stockCardBack.id);
		expect(reopened.CardTextHTML).toBe(
			"<p>Gets <strong>Dominate</strong>.</p>",
		);
	});
});
