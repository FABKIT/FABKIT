/**
 * Card Storage Persistence Layer
 *
 * Manages IndexedDB storage for saved cards, including serialization,
 * import/export functionality, and CRUD operations.
 *
 * ## IndexedDB Schema
 * - **Database**: "fabkit-cards" (version 1)
 * - **Object Store**: "cards"
 * - **Primary Key**: "version" (UUID from CardCreatorState.__version)
 * - **Indexes**:
 *   - cardName (non-unique)
 *   - createdAt (non-unique)
 *   - updatedAt (non-unique, used for default sorting)
 *
 * ## Serialization Format
 * - CardBack objects are converted to numeric IDs for storage
 * - Blob objects (artwork, preview) are stored directly in IndexedDB
 * - For export, Blobs are converted to base64 data URLs
 *
 * ## .fabkit File Format
 * JSON structure with base64-encoded images:
 * ```json
 * {
 *   "version": "uuid",
 *   "cardName": "string",
 *   "createdAt": timestamp,
 *   "updatedAt": timestamp,
 *   "preview": "data:image/png;base64,...",
 *   "state": { ...SerializedCardState with base64 artwork }
 * }
 * ```
 */

import { CardBacks } from "../config/cards/card_backs.ts";
import type { CardCreatorState } from "../stores/card-creator";

/** IndexedDB database name */
const DB_NAME = "fabkit-cards";

/** IndexedDB database version (increment to trigger schema migrations) */
const DB_VERSION = 1;

/** IndexedDB object store name */
const STORE_NAME = "cards";

/**
 * Stored card record in IndexedDB.
 * Contains all metadata and card state needed to restore a saved card.
 */
export interface StoredCard {
	/** Primary key: UUID from CardCreatorState.__version */
	version: string;

	/** User-provided card name (or "unnamed") */
	cardName: string;

	/** Unix timestamp when card was first created */
	createdAt: number;

	/** Unix timestamp of last update */
	updatedAt: number;

	/** Preview image Blob (PNG rendered from SVG) */
	preview: Blob;

	/** Serialized card creator state */
	state: SerializedCardState;
}

/**
 * Serialized card state for storage.
 * CardBack object is replaced with numeric ID for simpler serialization.
 */
export interface SerializedCardState
	extends Omit<CardCreatorState, "CardBack"> {
	/** CardBack ID instead of full object */
	CardBack: number | null;
}

/** Cached database instance to avoid multiple open requests */
let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and returns the IndexedDB database instance.
 * Creates the database and schema on first run.
 * Subsequent calls return the cached instance.
 *
 * @returns Promise resolving to the IDBDatabase instance
 * @throws Error if database initialization fails
 */
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

/**
 * Converts CardCreatorState to a serializable format.
 * Replaces the CardBack object with its numeric ID.
 *
 * @param state - Full card creator state
 * @returns Serialized state safe for IndexedDB storage
 */
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
	};
}

/**
 * Converts stored card state back to CardCreatorState format.
 * Restores the CardBack object from its ID.
 * Falls back to first card back if ID lookup fails.
 *
 * @param stored - Serialized card state from IndexedDB
 * @returns Partial CardCreatorState ready to load into the store
 */
export function deserializeCardState(
	stored: SerializedCardState,
): Partial<CardCreatorState> {
	return {
		...stored,
		CardBack:
			CardBacks.find((back) => back.id === stored.CardBack) || CardBacks[0],
	};
}

/**
 * Saves a new card to IndexedDB.
 * Sets createdAt and updatedAt to current timestamp.
 *
 * @param name - User-provided card name
 * @param state - Current card creator state
 * @param preview - Preview image Blob (PNG)
 * @returns Promise resolving to the card's version UUID
 * @throws Error if save operation fails (e.g., duplicate version)
 */
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

/**
 * Updates an existing card in IndexedDB.
 * Preserves createdAt timestamp and updates updatedAt to current time.
 *
 * @param version - Card version UUID (primary key)
 * @param state - Updated card creator state
 * @param preview - Updated preview image Blob (PNG)
 * @throws Error if card doesn't exist or update operation fails
 */
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
		cardName: state.CardName || "unnamed",
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

/**
 * Retrieves a single card by its version UUID.
 *
 * @param version - Card version UUID (primary key)
 * @returns Promise resolving to StoredCard or null if not found
 * @throws Error if database query fails
 */
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

/**
 * Retrieves all saved cards, sorted by most recently updated first.
 * Uses the "updatedAt" index for efficient sorting.
 *
 * @returns Promise resolving to array of StoredCard objects
 * @throws Error if database query fails
 */
export async function getAllCards(): Promise<StoredCard[]> {
	const db = await initCardDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readonly");
		const store = transaction.objectStore(STORE_NAME);
		const index = store.index("updatedAt");
		const request = index.openCursor(null, "prev"); // Sort by updatedAt descending

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

/**
 * Deletes a card from IndexedDB.
 *
 * @param version - Card version UUID (primary key)
 * @throws Error if delete operation fails
 */
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

/**
 * Converts a Blob to a base64 data URL.
 * Used for embedding images in JSON export format.
 *
 * @param blob - Image Blob to convert
 * @returns Promise resolving to base64 data URL string
 * @throws Error if FileReader fails
 */
async function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

/**
 * Exports a card to .fabkit JSON format.
 * Converts all Blob images (preview, artwork) to base64 for portability.
 *
 * @param card - Stored card to export
 * @returns Promise resolving to formatted JSON string
 */
export async function exportCardToJSON(card: StoredCard): Promise<string> {
	// Convert preview Blob to base64
	const previewBase64 = await blobToBase64(card.preview);

	// Convert artwork Blob to base64 if it exists
	const artworkBase64 = card.state.CardArtwork
		? await blobToBase64(card.state.CardArtwork)
		: null;

	// Create exportable object with base64 images
	const exportData = {
		version: card.version,
		cardName: card.cardName,
		createdAt: card.createdAt,
		updatedAt: card.updatedAt,
		preview: previewBase64,
		state: {
			...card.state,
			CardArtwork: artworkBase64,
		},
	};

	return JSON.stringify(exportData, null, 2);
}

/**
 * Triggers browser download of card JSON as a .fabkit file.
 * Creates a temporary download link and auto-clicks it.
 *
 * @param jsonString - Card JSON from exportCardToJSON()
 * @param cardName - Card name (sanitized for filename)
 */
export function downloadCardJSON(jsonString: string, cardName: string): void {
	const blob = new Blob([jsonString], { type: "application/fabkit+json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${cardName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.fabkit`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Converts a base64 data URL back to a Blob.
 * Used when importing .fabkit files.
 *
 * @param base64 - Base64 data URL string
 * @returns Promise resolving to Blob
 */
async function base64ToBlob(base64: string): Promise<Blob> {
	const response = await fetch(base64);
	return response.blob();
}

/**
 * Imports a card from .fabkit JSON format into IndexedDB.
 * Converts base64 images back to Blobs and saves the card.
 * Uses put() operation, so it will overwrite existing cards with same version UUID.
 *
 * @param jsonString - .fabkit file contents
 * @throws Error if JSON is invalid or missing required fields
 */
export async function importCardFromJSON(jsonString: string): Promise<void> {
	const data = JSON.parse(jsonString);

	// Validate basic structure
	if (!data.version || !data.cardName || !data.state) {
		throw new Error("Invalid card file format");
	}

	// Convert base64 images back to Blobs
	const preview = await base64ToBlob(data.preview);
	const artwork = data.state.CardArtwork
		? await base64ToBlob(data.state.CardArtwork)
		: null;

	// Create the stored card object
	const card: StoredCard = {
		version: data.version,
		cardName: data.cardName,
		createdAt: data.createdAt || Date.now(),
		updatedAt: Date.now(), // Update to current time on import
		preview,
		state: {
			...data.state,
			CardArtwork: artwork,
		},
	};

	// Save to IndexedDB (will overwrite if version already exists)
	const db = await initCardDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(card); // Use put instead of add to allow overwriting

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}
