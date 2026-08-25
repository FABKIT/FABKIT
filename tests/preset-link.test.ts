import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import { loadPresetLink } from "../src/apps/card-creator/preset-link/preset-link.ts";
import {
	defaultMeldHalf,
	useCardCreator,
} from "../src/apps/card-creator/stores/card-creator.ts";
import { CardBacks } from "../src/shared/config/cards/card_backs.ts";

const ARTWORK_WIDTH = 900;
const ARTWORK_HEIGHT = 1256;

const originalFetch = globalThis.fetch;

/** Flipped by the decode-failure test; reset before each one. */
let shouldImageDecode = true;

/** setCardArtwork measures the blob by loading it into an Image, which Bun's
 * test runtime doesn't implement. The stub reports a fixed natural size and
 * settles on the next microtask, which is all the store reads. */
class ImageStub {
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	naturalWidth = ARTWORK_WIDTH;
	naturalHeight = ARTWORK_HEIGHT;

	set src(_url: string) {
		queueMicrotask(() =>
			shouldImageDecode ? this.onload?.() : this.onerror?.(),
		);
	}
}

// Installed for this file only: `bun test` shares one process, so a stubbed
// Image left in place would quietly satisfy a later file's real decode.
const globals = globalThis as Record<string, unknown>;
const originalImage = globals.Image;
const urlStatics = URL as { revokeObjectURL?: (url: string) => void };
const originalRevokeObjectURL = urlStatics.revokeObjectURL;

beforeAll(() => {
	globals.Image = ImageStub;
	urlStatics.revokeObjectURL ??= () => {};
});

afterAll(() => {
	globals.Image = originalImage;
	urlStatics.revokeObjectURL = originalRevokeObjectURL;
});

beforeEach(() => {
	shouldImageDecode = true;
	useCardCreator.getState().reset();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
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

	it("ignores CardArtPosition/CardOverlay, and a CardArtwork that isn't a URL string — all out of scope for preset links", () => {
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

	it("fetches the CardArtwork URL and applies the image to the card", async () => {
		const artwork = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], {
			type: "image/jpeg",
		});
		globalThis.fetch = (() =>
			Promise.resolve(
				new Response(artwork, { headers: { "content-type": "image/jpeg" } }),
			)) as typeof fetch;

		await loadPresetLink({
			CardName: "Painted Card",
			CardArtwork: "https://fabkit.io/img/fabble/standardmode.webp",
		});

		const state = useCardCreator.getState();
		expect(state.CardName).toBe("Painted Card");
		expect(state.CardArtwork?.size).toBe(artwork.size);
		// Natural size at the origin, exactly where an interactive upload lands it.
		expect(state.CardArtPosition).toEqual({
			x: 0,
			y: 0,
			width: ARTWORK_WIDTH,
			height: ARTWORK_HEIGHT,
		});
	});

	it("applies every other field synchronously, before the artwork fetch resolves", () => {
		globalThis.fetch = (() => new Promise<Response>(() => {})) as typeof fetch;

		loadPresetLink({
			CardName: "Ahead Of The Art",
			CardArtwork: "https://fabkit.io/img/fabble/chaosmode.webp",
		});

		expect(useCardCreator.getState().CardName).toBe("Ahead Of The Art");
	});

	it("opens the card without artwork when the CardArtwork URL can't be fetched", async () => {
		globalThis.fetch = (() =>
			Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch;

		await loadPresetLink({
			CardName: "Artless",
			CardArtwork: "https://fabkit.io/img/fabble/does-not-exist.webp",
		});

		const state = useCardCreator.getState();
		expect(state.CardName).toBe("Artless");
		expect(state.CardArtwork).toBeNull();
	});

	it("opens the card without artwork when the fetched image can't be decoded", async () => {
		shouldImageDecode = false;
		globalThis.fetch = (() =>
			Promise.resolve(
				new Response(new Blob(["not really a jpeg"]), {
					headers: { "content-type": "image/jpeg" },
				}),
			)) as typeof fetch;

		await loadPresetLink({
			CardName: "Undecodable",
			CardArtwork: "https://fabkit.io/img/fabble/standardmode.webp",
		});

		const state = useCardCreator.getState();
		expect(state.CardName).toBe("Undecodable");
		expect(state.CardArtwork).toBeNull();
		expect(state.CardArtPosition).toBeNull();
	});

	it("never fetches artwork for a meld card, which takes its art per half", async () => {
		let wasFetched = false;
		globalThis.fetch = (() => {
			wasFetched = true;
			return Promise.reject(new TypeError("should not be called"));
		}) as typeof fetch;

		await loadPresetLink({
			CardType: "meld",
			CardArtwork: "https://fabkit.io/img/fabble/standardmode.webp",
		});

		expect(wasFetched).toBe(false);
		expect(useCardCreator.getState().CardArtwork).toBeNull();
	});

	it("keeps a late image off the card once the caller has aborted", async () => {
		const controller = new AbortController();
		globalThis.fetch = (() =>
			Promise.resolve(
				new Response(new Blob(["art"]), {
					headers: { "content-type": "image/jpeg" },
				}),
			)) as typeof fetch;

		const loading = loadPresetLink(
			{
				CardName: "Navigated Away",
				CardArtwork: "https://fabkit.io/img/fabble/standardmode.webp",
			},
			controller.signal,
		);
		controller.abort();
		await loading;

		expect(useCardCreator.getState().CardArtwork).toBeNull();
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
