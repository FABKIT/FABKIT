import { CardBacks } from "../config/cards/card_backs.ts";
import { compressJSON } from "../lib/compression";
import {
	type CardCreatorState,
	defaultMeldHalf,
	type MeldHalf,
} from "../stores/card-creator";

const DB_NAME = "fabkit-cards";
const DB_VERSION = 1;
const STORE_NAME = "cards";

// ─── Stored types (IndexedDB) ─────────────────────────────────────────────────

export interface StoredCard {
	version: string;
	cardName: string;
	createdAt: number;
	updatedAt: number;
	preview: Blob;
	state: SerializedCardState;
}

/** MeldHalf with CardArtwork serialized as a base64 data URL instead of a Blob. */
export type SerializedMeldHalf = Omit<MeldHalf, "CardArtwork"> & {
	CardArtwork: string | null;
};

export interface SerializedCardState
	extends Omit<CardCreatorState, "CardBack"> {
	/** CardBack ID instead of full object */
	CardBack: number | null;
}

// ─── File format types ────────────────────────────────────────────────────────

/** Card state as serialized in a .fabkit file: artwork fields are base64 strings. */
export type FabkitFileState = Omit<
	SerializedCardState,
	"CardArtwork" | "CardOverlay" | "meldHalfA" | "meldHalfB"
> & {
	CardArtwork: string | null;
	CardOverlay: string | null;
	meldHalfA: SerializedMeldHalf;
	meldHalfB: SerializedMeldHalf;
};

/** Single-card portable format. */
export interface FabkitFile {
	format: "fabkit";
	formatVersion: string;
	version: string;
	cardName: string;
	createdAt: number;
	updatedAt: number;
	preview: string;
	state: FabkitFileState;
}

/** Gallery export format — array of FabkitFile cards. */
export interface FabgalleryFile {
	format: "fabgallery";
	formatVersion: string;
	exportedAt: string;
	cardCount: number;
	cards: FabkitFile[];
}

export type GalleryImportMode = "replace" | "merge";
export type GalleryImportResult = { imported: number; skipped: number };

// ─── Database ─────────────────────────────────────────────────────────────────

let dbInstance: IDBDatabase | null = null;

export async function initCardDatabase(): Promise<IDBDatabase> {
	if (dbInstance) return dbInstance;

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			dbInstance = request.result;
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: "version" });
				store.createIndex("cardName", "cardName", { unique: false });
				store.createIndex("createdAt", "createdAt", { unique: false });
				store.createIndex("updatedAt", "updatedAt", { unique: false });
			}
		};
	});
}

// ─── Serialization ────────────────────────────────────────────────────────────

export function serializeCardState(
	state: CardCreatorState,
): SerializedCardState {
	return {
		__version: state.__version,
		CardType: state.CardType,
		CardBack: state.CardBack?.id || null,
		CardBackStyle: state.CardBackStyle,
		CardArtwork: state.CardArtwork,
		CardArtPosition: state.CardArtPosition,
		CardArtworkCredits: state.CardArtworkCredits,
		CardSetNumber: state.CardSetNumber,
		CardTextHTML: state.CardTextHTML,
		CardTextNode: state.CardTextNode,
		CardPitch: state.CardPitch,
		CardName: state.CardName,
		CardResource: state.CardResource,
		CardText: state.CardText,
		CardPower: state.CardPower,
		CardTalent: state.CardTalent,
		CardClass: state.CardClass,
		CardSecondaryClass: state.CardSecondaryClass,
		CardSubType: state.CardSubType,
		CardRarity: state.CardRarity,
		CardDefense: state.CardDefense,
		CardLife: state.CardLife,
		CardHeroIntellect: state.CardHeroIntellect,
		CardWeapon: state.CardWeapon,
		CardMacroGroup: state.CardMacroGroup,
		CardOverlay: state.CardOverlay,
		CardOverlayOpacity: state.CardOverlayOpacity,
		meldActiveHalf: state.meldActiveHalf,
		meldHalfA: state.meldHalfA,
		meldHalfB: state.meldHalfB,
	};
}

export function deserializeCardState(
	stored: SerializedCardState,
): Partial<CardCreatorState> {
	return {
		...stored,
		CardBack:
			CardBacks.find((back) => back.id === stored.CardBack) || CardBacks[0],
	};
}

// ─── Image conversion ─────────────────────────────────────────────────────────

export async function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

export async function base64ToBlob(base64: string): Promise<Blob> {
	const response = await fetch(base64);
	return response.blob();
}

async function serializeMeldHalf(
	half: MeldHalf | undefined,
): Promise<SerializedMeldHalf> {
	const resolvedHalf = half ?? defaultMeldHalf;
	return {
		...resolvedHalf,
		CardArtwork: resolvedHalf.CardArtwork
			? await blobToBase64(resolvedHalf.CardArtwork)
			: null,
	};
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function saveCard(
	name: string,
	state: CardCreatorState,
	preview: Blob,
): Promise<string> {
	const db = await initCardDatabase();
	const now = Date.now();

	const card: StoredCard = {
		version: state.__version,
		cardName: name,
		createdAt: now,
		updatedAt: now,
		preview,
		state: serializeCardState(state),
	};

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.add(card);

		request.onsuccess = () => resolve(state.__version);
		request.onerror = () => reject(request.error);
	});
}

export async function updateCard(
	version: string,
	state: CardCreatorState,
	preview: Blob,
): Promise<void> {
	const db = await initCardDatabase();
	const existing = await getCard(version);

	if (!existing) {
		throw new Error("Card not found");
	}

	const card: StoredCard = {
		version,
		cardName:
			state.CardType === "meld"
				? [state.meldHalfA?.CardName, state.meldHalfB?.CardName]
						.filter(Boolean)
						.join(" // ") || "unnamed"
				: state.CardName || "unnamed",
		createdAt: existing.createdAt,
		updatedAt: Date.now(),
		preview,
		state: serializeCardState(state),
	};

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(card);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function getCard(version: string): Promise<StoredCard | null> {
	const db = await initCardDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readonly");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(version);

		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
}

export async function getAllCards(): Promise<StoredCard[]> {
	const db = await initCardDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readonly");
		const store = transaction.objectStore(STORE_NAME);
		const index = store.index("updatedAt");
		const request = index.openCursor(null, "prev");

		const cards: StoredCard[] = [];

		request.onsuccess = (event) => {
			const cursor = (event.target as IDBRequest).result;
			if (cursor) {
				cards.push(cursor.value);
				cursor.continue();
			} else {
				resolve(cards);
			}
		};

		request.onerror = () => reject(request.error);
	});
}

export async function deleteCard(version: string): Promise<void> {
	const db = await initCardDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete(version);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function clearGallery(): Promise<void> {
	const db = await initCardDatabase();
	return new Promise<void>((resolve, reject) => {
		const tx = db.transaction([STORE_NAME], "readwrite");
		tx.objectStore(STORE_NAME).clear();
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

// ─── Single-card export / import ─────────────────────────────────────────────

export async function exportCardToObject(
	card: StoredCard,
): Promise<FabkitFile> {
	const [preview, artwork, overlay, meldHalfA, meldHalfB] = await Promise.all([
		blobToBase64(card.preview),
		card.state.CardArtwork
			? blobToBase64(card.state.CardArtwork)
			: Promise.resolve(null),
		card.state.CardOverlay
			? blobToBase64(card.state.CardOverlay)
			: Promise.resolve(null),
		serializeMeldHalf(card.state.meldHalfA),
		serializeMeldHalf(card.state.meldHalfB),
	]);

	return {
		format: "fabkit",
		formatVersion: __APP_VERSION__,
		version: card.version,
		cardName: card.cardName,
		createdAt: card.createdAt,
		updatedAt: card.updatedAt,
		preview,
		state: {
			...(card.state as unknown as FabkitFileState),
			CardArtwork: artwork,
			CardOverlay: overlay,
			meldHalfA,
			meldHalfB,
		},
	};
}

export async function exportCardToJSON(card: StoredCard): Promise<string> {
	return JSON.stringify(await exportCardToObject(card), null, 2);
}

export async function importCardFromObject(data: FabkitFile): Promise<void> {
	const [preview, artwork, overlay, meldHalfAArtwork, meldHalfBArtwork] =
		await Promise.all([
			base64ToBlob(data.preview),
			data.state.CardArtwork
				? base64ToBlob(data.state.CardArtwork)
				: Promise.resolve(null),
			data.state.CardOverlay
				? base64ToBlob(data.state.CardOverlay)
				: Promise.resolve(null),
			data.state.meldHalfA?.CardArtwork
				? base64ToBlob(data.state.meldHalfA.CardArtwork)
				: Promise.resolve(null),
			data.state.meldHalfB?.CardArtwork
				? base64ToBlob(data.state.meldHalfB.CardArtwork)
				: Promise.resolve(null),
		]);

	const card: StoredCard = {
		version: data.version,
		cardName: data.cardName,
		createdAt: data.createdAt || Date.now(),
		updatedAt: Date.now(),
		preview,
		state: {
			...(data.state as unknown as SerializedCardState),
			CardArtwork: artwork,
			CardOverlay: overlay,
			meldHalfA: {
				...data.state.meldHalfA,
				CardArtwork: meldHalfAArtwork,
			} as MeldHalf,
			meldHalfB: {
				...data.state.meldHalfB,
				CardArtwork: meldHalfBArtwork,
			} as MeldHalf,
		},
	};

	const db = await initCardDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(card);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function importCardFromJSON(jsonString: string): Promise<void> {
	const data = JSON.parse(jsonString);
	if (!data.version || !data.cardName || !data.state) {
		throw new Error("Invalid card file format");
	}
	return importCardFromObject(data as FabkitFile);
}

export async function downloadCardJSON(
	jsonString: string,
	cardName: string,
): Promise<void> {
	const blob = await compressJSON(jsonString);
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${cardName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.fabkit`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ─── Gallery export / import ──────────────────────────────────────────────────

export async function exportGalleryToFile(cards: StoredCard[]): Promise<void> {
	const serialized = await Promise.all(cards.map(exportCardToObject));

	const gallery: FabgalleryFile = {
		format: "fabgallery",
		formatVersion: __APP_VERSION__,
		exportedAt: new Date().toISOString(),
		cardCount: serialized.length,
		cards: serialized,
	};

	const blob = await compressJSON(JSON.stringify(gallery));
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `fabkit-gallery-${new Date().toISOString().slice(0, 10)}.fabgallery`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export async function importGalleryFromJSON(
	jsonString: string,
	mode: GalleryImportMode,
): Promise<GalleryImportResult> {
	const data = JSON.parse(jsonString);

	if (!data || data.format !== "fabgallery" || !Array.isArray(data.cards)) {
		throw new Error("Invalid gallery file format");
	}

	const gallery = data as FabgalleryFile;

	if (mode === "replace") {
		await clearGallery();
		for (const card of gallery.cards) {
			await importCardFromObject(card);
		}
		return { imported: gallery.cards.length, skipped: 0 };
	}

	let imported = 0;
	let skipped = 0;
	for (const card of gallery.cards) {
		const existing = await getCard(card.version);
		if (existing) {
			skipped++;
		} else {
			await importCardFromObject(card);
			imported++;
		}
	}
	return { imported, skipped };
}
