import { beforeEach, describe, expect, it } from "bun:test";
import { loadPresetLink } from "../src/apps/card-creator/preset-link/preset-link.ts";
import {
	defaultMeldHalf,
	useCardCreator,
} from "../src/apps/card-creator/stores/card-creator.ts";
import { CardBacks } from "../src/shared/config/cards/card_backs.ts";

beforeEach(() => {
	useCardCreator.getState().reset();
});

describe("loadPresetLink", () => {
	it("is a silent no-op for a payload that isn't a well-formed object", () => {
		const before = useCardCreator.getState();
		loadPresetLink(null);
		loadPresetLink("not an object");
		loadPresetLink(["not", "an", "object"]);
		expect(useCardCreator.getState()).toEqual(before);
	});

	it("applies valid scalar fields and drops unrecognized ones", () => {
		loadPresetLink({
			CardType: "action",
			CardName: "Rolling Thunder",
			CardPitch: 2,
			CardClass: "ranger",
			CardTalent: "lightning",
			CardRarity: "rare",
			// invalid — not 1|2|3, must be dropped rather than crashing
			CardWeapon: "not-a-real-weapon",
			// unknown field entirely — must be ignored
			NotARealField: "whatever",
		});

		const state = useCardCreator.getState();
		expect(state.CardType).toBe("action");
		expect(state.CardName).toBe("Rolling Thunder");
		expect(state.CardPitch).toBe(2);
		expect(state.CardClass).toBe("ranger");
		expect(state.CardTalent).toBe("lightning");
		expect(state.CardRarity).toBe("rare");
		expect(state.CardWeapon).toBeNull();
	});

	it("parses restricted-markup CardText into CardTextHTML/CardTextNode", () => {
		loadPresetLink({ CardText: "Gets **Dominate**." });
		const state = useCardCreator.getState();
		expect(state.CardTextHTML).toBe("<p>Gets <strong>Dominate</strong>.</p>");
		expect(state.CardTextNode).not.toBeNull();
	});

	it("resolves a stock CardBack reference by id", () => {
		const target = CardBacks[0];
		loadPresetLink({ CardBack: { id: target.id } });
		expect(useCardCreator.getState().CardBack?.id).toBe(target.id);
	});

	it("drops a CardBack reference to a stock id that doesn't exist", () => {
		const bogusId = Math.max(...CardBacks.map((b) => b.id)) + 1000;
		const before = useCardCreator.getState().CardBack;
		loadPresetLink({ CardBack: { id: bogusId } });
		expect(useCardCreator.getState().CardBack).toEqual(before);
	});

	it("ignores a custom CardBack reference — out of scope for preset links", () => {
		const before = useCardCreator.getState().CardBack;
		loadPresetLink({
			CardBack: {
				kind: "custom",
				url: "https://example.com/frame.png",
				name: "My Frame",
				type: "general",
				dented: true,
			},
		});
		expect(useCardCreator.getState().CardBack).toEqual(before);
	});

	it("ignores CardArtwork/CardArtPosition/CardOverlay — out of scope for preset links", () => {
		loadPresetLink({
			CardArtwork: { url: "https://example.com/art.png" },
			CardArtPosition: { x: 0, y: 0, width: 450, height: 628 },
			CardOverlay: { url: "https://example.com/overlay.png" },
			CardOverlayOpacity: 0.5,
		});
		const state = useCardCreator.getState();
		expect(state.CardArtwork).toBeNull();
		expect(state.CardArtPosition).toBeNull();
		expect(state.CardOverlay).toBeNull();
	});

	it("always starts a brand-new card — meld halves reset to default even if the store previously had different meld data", () => {
		useCardCreator.setState({
			meldHalfA: { ...defaultMeldHalf, CardName: "Leftover From Before" },
		});
		expect(useCardCreator.getState().meldHalfA.CardName).toBe(
			"Leftover From Before",
		);

		loadPresetLink({ CardName: "Fresh Card" });

		expect(useCardCreator.getState().CardName).toBe("Fresh Card");
		expect(useCardCreator.getState().meldHalfA).toEqual(defaultMeldHalf);
	});

	it("applies preset-supplied meld half fields on top of the defaults", () => {
		loadPresetLink({
			CardType: "meld",
			meldHalfA: { CardName: "Heads", CardType: "action" },
			meldHalfB: { CardName: "Tails", CardType: "action" },
		});
		const state = useCardCreator.getState();
		expect(state.meldHalfA.CardName).toBe("Heads");
		expect(state.meldHalfB.CardName).toBe("Tails");
	});
});
