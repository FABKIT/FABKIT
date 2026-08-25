import { base64ToBlob, blobToBase64 } from "@fabkit/shared/blob";
import { compressJSON } from "@fabkit/shared/compression";
import { CardBacks } from "@fabkit/shared/config/cards/card_backs.ts";
import type { CardStyle } from "@fabkit/shared/config/cards/card_styles.ts";
import type { CardFormFieldValue } from "@fabkit/shared/config/cards/form_fields.ts";
import type { CardType } from "@fabkit/shared/config/cards/types.ts";
import type { Content } from "@tiptap/react";
import semver from "semver";
import { v4 as uuid } from "uuid";
import { makeMissingFramePlaceholder } from "../config/card-backs.ts";
import type { CardCreatorCardBack } from "../config/rendering.ts";
import {
	type CardCreatorState,
	defaultMeldHalf,
	HYBRID_BLEND_DEFAULT,
	HYBRID_SPLIT_DEFAULT,
	type MeldHalf,
} from "../stores/card-creator";
import {
	broadcastCustomFramesChanged,
	getCustomFrameById,
	reloadCustomFrames,
} from "../stores/custom-frames.ts";
import {
	type EmbeddedCustomFrameImage,
	type EmbeddedCustomFrameMeta,
	embedCustomFramesForCard,
	embedCustomFramesForCards,
	reconcileImportedCustomFrames,
	remapCustomFrameId,
} from "./custom-frames-storage.ts";
import { db } from "./db.ts";
import { meld_cards_migration } from "./migrations/0-1-0-meld-cards.ts";
import type { Migration } from "./migrations.ts";

// ─── Schema versioning ────────────────────────────────────────────────────────

/** Version assigned to records created before the migration system existed. */
const LEGACY_SCHEMA_VERSION = "0.0.0";

/**
 * Data-level migrations for SerializedCardState, in ascending version order.
 * A migration runs when the stored record's schemaVersion is older than migration.version.
 *
 * Example:
 *   { version: "1.1.0", migrate: (state) => { ... } }
 */
const MIGRATIONS: Migration[] = [meld_cards_migration];

function toSemver(version: string): string {
	return (
		semver.valid(version) ??
		semver.coerce(version)?.version ??
		LEGACY_SCHEMA_VERSION
	);
}

function applyStateMigrations(
	state: unknown,
	fromVersion: string,
): SerializedCardState {
	const from = toSemver(fromVersion);
	let current = state;
	for (const { version, migrate } of MIGRATIONS) {
		if (semver.gt(version, from)) {
			console.info(`Applying migration ${version} to card state`);
			current = migrate(current);
		}
	}
	return current as SerializedCardState;
}

// ─── Stored types (IndexedDB) ─────────────────────────────────────────────────

export interface StoredCard {
	version: string;
	cardName: string;
	createdAt: number;
	updatedAt: number;
	preview: Blob;
	state: SerializedCardState;
	/** App version that wrote this record. Absent on legacy records; treated as "0.0.0". */
	schemaVersion?: string;
	/** Folder this card lives in. Absent (not null, not a sentinel) means gallery root. */
	folderId?: string;
}

/**
 * A gallery folder. `id` is an internal UUID used as the adjacency-list primary key
 * for efficient move/query — it is never exposed to the user or treated as identity
 * for import/export reconciliation. The user-facing / reconciliation identity is the
 * path, i.e. `(parentId, name)`; siblings (same parentId) must have unique names.
 */
export interface StoredFolder {
	id: string;
	name: string;
	/** Parent folder id. Absent means this folder lives at gallery root. */
	parentId?: string;
	createdAt: number;
	updatedAt: number;
}

/** Folder name constraints, shared by createFolder/renameFolder validation. */
const FOLDER_NAME_MAX_LENGTH = 20;

/** Maximum folder nesting depth (root's direct children are depth 1). */
const MAX_FOLDER_DEPTH = 5;

/** MeldHalf with CardArtwork serialized as a base64 data URL instead of a Blob. */
export type SerializedMeldHalf = Omit<MeldHalf, "CardArtwork"> & {
	CardArtwork: string | null;
};

/**
 * Card state as stored in IndexedDB.
 * Differs from CardCreatorState in two ways:
 *   - CardBack is stored as a numeric ID (reconstructed on load via CardBacks.find)
 *   - CardArtwork, CardOverlay, and meld half artwork remain as Blob — IndexedDB stores these natively
 */
export interface SerializedCardState {
	__version: string;
	CardType: CardType | null;
	CardBack: number | null;
	/** Right-half card back id for hybrid frames. Null (or absent, on older records) means not hybrid. */
	CardBackRight: number | null;
	/** Hybrid seam position, fraction of card width. Absent on pre-seam records. */
	CardBackSplit: number;
	/** Hybrid seam softness, 0..1. Absent on pre-seam records. */
	CardBackBlend: number;
	CardBackStyle: CardStyle;
	CardArtwork: Blob | null;
	CardArtPosition: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null;
	CardArtworkCredits: string | null;
	CardSetNumber: string | null;
	CardTextHTML: string | null;
	CardTextNode: Content | null;
	CardPitch: CardFormFieldValue["CardPitch"] | null;
	CardName: CardFormFieldValue["CardName"] | null;
	CardResource: CardFormFieldValue["CardResource"] | null;
	CardText: CardFormFieldValue["CardText"] | null;
	CardPower: CardFormFieldValue["CardPower"] | null;
	CardTalent: CardFormFieldValue["CardTalent"] | null;
	CardClass: CardFormFieldValue["CardClass"] | null;
	CardSecondaryClass: CardFormFieldValue["CardSecondaryClass"] | null;
	CardSubType: CardFormFieldValue["CardSubType"] | null;
	CardRarity: CardFormFieldValue["CardRarity"] | null;
	CardDefense: CardFormFieldValue["CardDefense"] | null;
	CardLife: CardFormFieldValue["CardLife"] | null;
	CardHeroIntellect: CardFormFieldValue["CardHeroIntellect"] | null;
	CardWeapon: CardFormFieldValue["CardWeapon"] | null;
	CardMacroGroup: CardFormFieldValue["CardMacroGroup"] | null;
	CardOverlay: Blob | null;
	CardOverlayOpacity: number;
	meldActiveHalf: "A" | "B";
	meldHalfA: MeldHalf;
	meldHalfB: MeldHalf;
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
	/**
	 * Present only when exported with `includeFullResImages: false` (the
	 * `.fabreport` path). Describes the images that were omitted from `state`
	 * (serialized as `null` there) so a diagnostic viewer can still show what
	 * was dropped without embedding the bytes themselves.
	 */
	imageStats?: Record<string, { byteSize: number; type: string } | null>;
	/**
	 * Custom (user-uploaded) frame metadata this card's CardBack/CardBackRight
	 * reference, living BESIDE `state` (same placement as `folders` on
	 * FabgalleryFile) — never inside `SerializedCardState`, so it's untouched
	 * by MIGRATIONS. Absent on a standalone export that references no custom
	 * frames. A `.fabgallery` populates this ONLY per-card when exported
	 * standalone (exportCardToObject); exportGalleryToFile hoists this to the
	 * gallery-level fields instead, so per-card entries within a gallery leave
	 * these undefined — see FabgalleryFile's customFrames/customFrameImages.
	 */
	customFrames?: EmbeddedCustomFrameMeta[];
	/** Distinct images referenced by `customFrames`, embedded once each. */
	customFrameImages?: EmbeddedCustomFrameImage[];
}

/**
 * A card entry within a .fabgallery export: the same portable `.fabkit` shape,
 * plus (optionally) the folder it lived in at export time — resolved against the
 * gallery's `folders` array by id. Absent means gallery root, same convention as
 * `StoredCard.folderId`. This field lives here, not on `FabkitFile` itself,
 * because a standalone `.fabkit` never carries folder membership.
 */
export type FabgalleryCardEntry = FabkitFile & { folderId?: string };

/** Gallery export format — array of card entries, plus the folder tree. */
export interface FabgalleryFile {
	format: "fabgallery";
	formatVersion: string;
	exportedAt: string;
	cardCount: number;
	cards: FabgalleryCardEntry[];
	/**
	 * Folder tree at export time. `id`/`parentId` are only meaningful as internal
	 * linkage within this file (and as merge-import scratch state) — a folder's
	 * real identity for reconciliation purposes is its `(parentId, name)` path.
	 * Optional so older `.fabgallery` files (no folders concept yet) still import
	 * cleanly — every card lands at root, unchanged from before this field existed.
	 */
	folders?: StoredFolder[];
	/**
	 * Present only when a producer (currently: the `.fabreport` provider)
	 * stopped short of embedding every card to stay under a size budget.
	 * Absent on a real `.fabgallery` export, which is always complete.
	 */
	truncated?: { omittedCards: number; reason: "size-budget" };
	/**
	 * Every custom frame mirror referenced by ANY card in `cards`, hoisted and
	 * deduped here rather than repeated per-card entry — see
	 * embedCustomFramesForCards. This is what keeps N cards sharing one custom
	 * frame from costing N copies of its image in the exported file.
	 */
	customFrames?: EmbeddedCustomFrameMeta[];
	/** Distinct images referenced by `customFrames`, embedded once each. */
	customFrameImages?: EmbeddedCustomFrameImage[];
}

export type GalleryImportMode = "replace" | "merge";
export type GalleryImportResult = {
	imported: number;
	skipped: number;
	foldersCreated: number;
	foldersMerged: number;
};

// ─── Migration helpers ────────────────────────────────────────────────────────

function migrateCard(card: StoredCard): StoredCard {
	const from = card.schemaVersion ?? LEGACY_SCHEMA_VERSION;
	const needsMigration = MIGRATIONS.some(({ version }) =>
		semver.gt(version, toSemver(from)),
	);
	if (!needsMigration) return card;
	return {
		...card,
		state: applyStateMigrations(card.state, from),
		schemaVersion: __APP_VERSION__,
	};
}

// ─── Serialization ────────────────────────────────────────────────────────────

export function serializeCardState(
	state: CardCreatorState,
): SerializedCardState {
	return {
		__version: state.__version,
		CardType: state.CardType,
		CardBack: state.CardBack?.id || null,
		CardBackRight: state.CardBackRight?.id ?? null,
		CardBackSplit: state.CardBackSplit,
		CardBackBlend: state.CardBackBlend,
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

/**
 * Resolves a negative (custom-frame) id to a renderable frame — either the
 * real frame from the registry, or a missing-frame placeholder that
 * preserves the original id. Shared by both resolveStoredCardBack and
 * resolveStoredCardBackRight, since this half of the resolution is identical
 * for both; only the positive-id fallback differs between them.
 */
function resolveCustomFrameOrPlaceholder(
	id: number,
	cardType: CardType | null,
	style: CardStyle,
): CardCreatorCardBack {
	return (
		getCustomFrameById(id) ?? makeMissingFramePlaceholder(id, cardType, style)
	);
}

/**
 * Resolves a stored CardBack id to a renderable frame, discriminating on
 * sign. Positive ids are the (unchanged, pre-existing) stock manifest path.
 * Negative ids are the custom-frame id space (see config/card-backs.ts) and
 * MUST NEVER fall through to CardBacks[0] on a miss — a card save writes
 * `state.CardBack?.id` straight back to storage, so silently substituting a
 * stock frame here would get permanently baked in on the very next save. The
 * missing-frame placeholder preserves the original id instead, so a save is
 * always a no-op for an unresolvable custom frame reference.
 */
export function resolveStoredCardBack(
	id: number | null,
	cardType: CardType | null,
	style: CardStyle,
): CardCreatorCardBack {
	if (id !== null && id < 0) {
		return resolveCustomFrameOrPlaceholder(id, cardType, style);
	}
	return (CardBacks.find((back) => back.id === id) ||
		CardBacks[0]) as CardCreatorCardBack;
}

/**
 * Right-half equivalent of resolveStoredCardBack. Unlike the left half, an
 * unresolved POSITIVE id means "not hybrid" (null), never "use the first
 * frame" — see the comment on the CardBackRight branch in
 * deserializeCardState below. An unresolved NEGATIVE (custom-frame) id is
 * different: it still returns a non-null missing-frame placeholder (never
 * null), the same as the left half, so the card stays hybrid and the
 * reference is preserved rather than silently turning hybrid off.
 */
export function resolveStoredCardBackRight(
	id: number | null,
	cardType: CardType | null,
	style: CardStyle,
): CardCreatorCardBack | null {
	if (id !== null && id < 0) {
		return resolveCustomFrameOrPlaceholder(id, cardType, style);
	}
	return (
		(CardBacks.find((back) => back.id === id) as
			| CardCreatorCardBack
			| undefined) ?? null
	);
}

export function deserializeCardState(
	stored: SerializedCardState,
): Partial<CardCreatorState> {
	return {
		...stored,
		CardBack: resolveStoredCardBack(
			stored.CardBack,
			stored.CardType,
			stored.CardBackStyle,
		),
		// Deliberately no CardBacks[0] fallback here — unlike CardBack, an
		// unresolved right half means "not hybrid", not "use the first frame".
		// Copying the left half's fallback would turn every pre-existing card
		// into a hybrid on load. Meld is also force-cleared: meld is excluded
		// from hybrid entirely, and a hand-edited or stale record could
		// otherwise render two meld frames spliced together.
		CardBackRight:
			stored.CardType === "meld"
				? null
				: resolveStoredCardBackRight(
						stored.CardBackRight,
						stored.CardType,
						stored.CardBackStyle,
					),
		// Seam settings postdate the first hybrid release, so records written in
		// between carry a right frame but no seam values. Fall back to the
		// defaults rather than NaN-ing the gradient maths.
		CardBackSplit: stored.CardBackSplit ?? HYBRID_SPLIT_DEFAULT,
		CardBackBlend: stored.CardBackBlend ?? HYBRID_BLEND_DEFAULT,
	};
}

// ─── Image conversion ─────────────────────────────────────────────────────────

export { base64ToBlob, blobToBase64 } from "@fabkit/shared/blob";

async function serializeMeldHalf(
	half: MeldHalf | undefined,
	includeFullResImages: boolean,
): Promise<{
	serialized: SerializedMeldHalf;
	imageStats: { byteSize: number; type: string } | null;
}> {
	const resolvedHalf = half ?? defaultMeldHalf;
	const artwork = resolvedHalf.CardArtwork;
	return {
		serialized: {
			...resolvedHalf,
			CardArtwork:
				artwork && includeFullResImages ? await blobToBase64(artwork) : null,
		},
		imageStats: artwork ? { byteSize: artwork.size, type: artwork.type } : null,
	};
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function saveCard(
	name: string,
	state: CardCreatorState,
	preview: Blob,
): Promise<string> {
	const now = Date.now();
	const card: StoredCard = {
		version: state.__version,
		cardName: name,
		createdAt: now,
		updatedAt: now,
		preview,
		state: serializeCardState(state),
		schemaVersion: __APP_VERSION__,
	};
	await db.cards.add(card);
	return state.__version;
}

export async function updateCard(
	version: string,
	state: CardCreatorState,
	preview: Blob,
): Promise<void> {
	const existing = await getCard(version);
	if (!existing) throw new Error("Card not found");

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
		schemaVersion: __APP_VERSION__,
	};

	await db.cards.put(card);
}

export async function getCard(version: string): Promise<StoredCard | null> {
	const card = await db.cards.get(version);
	return card ? migrateCard(card) : null;
}

// ─── Folders ──────────────────────────────────────────────────────────────────

/** In-memory folder tree node, assembled by getFolderTree(). */
export interface FolderTreeNode extends StoredFolder {
	children: FolderTreeNode[];
}

function assertValidFolderName(name: string): void {
	if (!name.trim()) {
		throw new Error("Folder name cannot be empty");
	}
	if (name.length > FOLDER_NAME_MAX_LENGTH) {
		throw new Error(
			`Folder name cannot exceed ${FOLDER_NAME_MAX_LENGTH} characters`,
		);
	}
}

async function assertUniqueSiblingName(
	name: string,
	parentId: string | undefined,
	excludeId?: string,
): Promise<void> {
	const siblings = await db.folders
		.filter((f) => f.parentId === parentId && f.id !== excludeId)
		.toArray();
	if (siblings.some((f) => f.name === name)) {
		throw new Error(`A folder named "${name}" already exists here`);
	}
}

/**
 * Ancestor chain of a folder, from root down to and including `folderId` itself.
 * Returns `[]` for root (`folderId` absent). Dangling/unresolved parent links
 * terminate the walk early rather than throwing — treated as if that ancestor
 * were root.
 */
export async function getAncestors(
	folderId: string | undefined,
): Promise<StoredFolder[]> {
	const chain: StoredFolder[] = [];
	let currentId = folderId;
	const visited = new Set<string>();
	while (currentId && !visited.has(currentId)) {
		visited.add(currentId);
		const folder = await db.folders.get(currentId);
		if (!folder) break;
		chain.unshift(folder);
		currentId = folder.parentId;
	}
	return chain;
}

/** All descendant folder ids of `folderId` (not including itself), unordered. */
export async function getDescendantFolderIds(
	folderId: string,
): Promise<string[]> {
	const all = await db.folders.toArray();
	const childrenByParent = new Map<string, string[]>();
	for (const f of all) {
		if (!f.parentId) continue;
		const siblings = childrenByParent.get(f.parentId) ?? [];
		siblings.push(f.id);
		childrenByParent.set(f.parentId, siblings);
	}

	const result: string[] = [];
	const visited = new Set<string>();
	const stack = [...(childrenByParent.get(folderId) ?? [])];
	while (stack.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: stack.length > 0 guarantees pop() is defined
		const current = stack.pop()!;
		if (visited.has(current)) continue; // guard against corrupt cycles
		visited.add(current);
		result.push(current);
		stack.push(...(childrenByParent.get(current) ?? []));
	}
	return result;
}

/** Height of the subtree rooted at `folderId`: 0 if it has no children, else
 * the number of levels below it (longest child chain). Used to make sure
 * moving a folder with descendants doesn't push them past MAX_FOLDER_DEPTH. */
async function getSubtreeHeight(folderId: string): Promise<number> {
	const all = await db.folders.toArray();
	const childrenByParent = new Map<string, string[]>();
	for (const f of all) {
		if (!f.parentId) continue;
		const siblings = childrenByParent.get(f.parentId) ?? [];
		siblings.push(f.id);
		childrenByParent.set(f.parentId, siblings);
	}

	function heightOf(id: string, visited: Set<string>): number {
		if (visited.has(id)) return 0; // guard against corrupt cycles
		visited.add(id);
		const children = childrenByParent.get(id) ?? [];
		if (children.length === 0) return 0;
		return 1 + Math.max(...children.map((child) => heightOf(child, visited)));
	}

	return heightOf(folderId, new Set());
}

export async function createFolder(
	name: string,
	parentId?: string,
): Promise<StoredFolder> {
	assertValidFolderName(name);
	const trimmedName = name.trim();
	const parentAncestors = await getAncestors(parentId);
	if (parentAncestors.length + 1 > MAX_FOLDER_DEPTH) {
		throw new Error(
			`Folders cannot be nested more than ${MAX_FOLDER_DEPTH} levels deep`,
		);
	}
	await assertUniqueSiblingName(trimmedName, parentId);

	const now = Date.now();
	const folder: StoredFolder = {
		id: uuid(),
		name: trimmedName,
		parentId,
		createdAt: now,
		updatedAt: now,
	};
	await db.folders.add(folder);
	return folder;
}

export async function renameFolder(id: string, name: string): Promise<void> {
	assertValidFolderName(name);
	const trimmedName = name.trim();
	const folder = await db.folders.get(id);
	if (!folder) throw new Error("Folder not found");
	await assertUniqueSiblingName(trimmedName, folder.parentId, id);
	await db.folders.update(id, { name: trimmedName, updatedAt: Date.now() });
}

export async function moveFolder(
	id: string,
	newParentId?: string,
): Promise<void> {
	const folder = await db.folders.get(id);
	if (!folder) throw new Error("Folder not found");

	if (newParentId === id) {
		throw new Error("A folder cannot be moved into itself");
	}

	if (newParentId) {
		const destinationAncestors = await getAncestors(newParentId);
		if (destinationAncestors.some((ancestor) => ancestor.id === id)) {
			throw new Error(
				"A folder cannot be moved into one of its own descendants",
			);
		}
		const subtreeHeight = await getSubtreeHeight(id);
		if (destinationAncestors.length + 1 + subtreeHeight > MAX_FOLDER_DEPTH) {
			throw new Error(
				`Folders cannot be nested more than ${MAX_FOLDER_DEPTH} levels deep`,
			);
		}
	}

	await assertUniqueSiblingName(folder.name, newParentId, id);
	await db.folders.update(id, { parentId: newParentId, updatedAt: Date.now() });
}

/**
 * Cascade-deletes a folder along with all descendant folders and all cards
 * contained anywhere in that subtree, in a single transaction.
 */
export async function deleteFolder(id: string): Promise<void> {
	const descendantIds = await getDescendantFolderIds(id);
	const folderIds = [id, ...descendantIds];

	await db.transaction("rw", db.folders, db.cards, async () => {
		await db.cards.where("folderId").anyOf(folderIds).delete();
		await db.folders.bulkDelete(folderIds);
	});
}

export async function getAllFolders(): Promise<StoredFolder[]> {
	return db.folders.toArray();
}

/**
 * Assembles the flat folders table into a nested tree. Folders with a dangling/
 * unresolved `parentId` (no matching row) are treated as roots rather than dropped.
 */
export async function getFolderTree(): Promise<FolderTreeNode[]> {
	const all = await getAllFolders();
	const byId = new Map<string, FolderTreeNode>();
	for (const folder of all) {
		byId.set(folder.id, { ...folder, children: [] });
	}

	const roots: FolderTreeNode[] = [];
	for (const folder of all) {
		// biome-ignore lint/style/noNonNullAssertion: node was just seeded above from the same list
		const node = byId.get(folder.id)!;
		const parent = folder.parentId ? byId.get(folder.parentId) : undefined;
		if (parent) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}
	return roots;
}

/**
 * Recursive count of descendant folders + cards contained in `id`'s subtree
 * (including `id` itself), used for the cascade-delete confirmation prompt.
 */
export async function getFolderContentsCount(id: string): Promise<number> {
	const descendantIds = await getDescendantFolderIds(id);
	const folderIds = [id, ...descendantIds];
	const cardCount = await db.cards.where("folderId").anyOf(folderIds).count();
	return descendantIds.length + cardCount;
}

export async function moveCardToFolder(
	version: string,
	folderId?: string,
): Promise<void> {
	await db.cards.update(version, { folderId });
}

/**
 * Cards directly within `folderId`. Root (`folderId` absent) can't be queried via
 * an indexed `.equals()` in IndexedDB, so it's handled with a `.filter()` instead —
 * the convention throughout this module is "absent", never `null` or a sentinel.
 */
export async function getCardsInFolder(
	folderId?: string,
): Promise<StoredCard[]> {
	const cards = folderId
		? await db.cards.where("folderId").equals(folderId).toArray()
		: await db.cards.filter((card) => card.folderId == null).toArray();
	return cards.map(migrateCard);
}

/** Cards + folders in one call, for gallery-view loaders. */
export async function getAllCardsWithFolders(): Promise<{
	cards: StoredCard[];
	folders: StoredFolder[];
}> {
	const [cards, folders] = await Promise.all([getAllCards(), getAllFolders()]);
	return { cards, folders };
}

export async function getAllCards(): Promise<StoredCard[]> {
	const cards = await db.cards.orderBy("updatedAt").reverse().toArray();
	return cards.map(migrateCard);
}

export async function deleteCard(version: string): Promise<void> {
	await db.cards.delete(version);
}

export async function clearGallery(): Promise<void> {
	await db.transaction("rw", db.cards, db.folders, async () => {
		await db.cards.clear();
		await db.folders.clear();
	});
}

// ─── Single-card export / import ─────────────────────────────────────────────

export async function exportCardToObject(
	card: StoredCard,
	options: {
		includeFullResImages?: boolean;
		/**
		 * false when called per-card from exportGalleryToFile, which hoists
		 * custom-frame embedding to the gallery level instead (see
		 * embedCustomFramesForCards) — must default true so a standalone
		 * `.fabkit` export (the only other caller) is self-contained.
		 */
		includeCustomFrames?: boolean;
	} = {},
): Promise<FabkitFile> {
	const includeFullResImages = options.includeFullResImages ?? true;
	const includeCustomFrames = options.includeCustomFrames ?? true;
	const { CardArtwork, CardOverlay } = card.state;

	const [preview, artwork, overlay, meldHalfA, meldHalfB, embeddedFrames] =
		await Promise.all([
			blobToBase64(card.preview),
			CardArtwork && includeFullResImages
				? blobToBase64(CardArtwork)
				: Promise.resolve(null),
			CardOverlay && includeFullResImages
				? blobToBase64(CardOverlay)
				: Promise.resolve(null),
			serializeMeldHalf(card.state.meldHalfA, includeFullResImages),
			serializeMeldHalf(card.state.meldHalfB, includeFullResImages),
			includeCustomFrames
				? embedCustomFramesForCard(
						card.state.CardBack,
						card.state.CardBackRight,
						includeFullResImages,
					)
				: Promise.resolve(null),
		]);

	const file: FabkitFile = {
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
			meldHalfA: meldHalfA.serialized,
			meldHalfB: meldHalfB.serialized,
		},
	};

	// Only attach imageStats when something was actually omitted — keeps the
	// default (lossless) export path byte-identical to before this option existed.
	if (!includeFullResImages) {
		file.imageStats = {
			CardArtwork: CardArtwork
				? { byteSize: CardArtwork.size, type: CardArtwork.type }
				: null,
			CardOverlay: CardOverlay
				? { byteSize: CardOverlay.size, type: CardOverlay.type }
				: null,
			meldHalfA: meldHalfA.imageStats,
			meldHalfB: meldHalfB.imageStats,
		};
	}

	if (embeddedFrames) {
		file.customFrames = embeddedFrames.metas;
		file.customFrameImages = embeddedFrames.images;
	}

	return file;
}

export async function exportCardToJSON(card: StoredCard): Promise<string> {
	return JSON.stringify(await exportCardToObject(card), null, 2);
}

/**
 * Shared body of importCardFromObject, parameterised on an already-resolved
 * frame id map so importGalleryFromJSON can reconcile a gallery's hoisted
 * customFrames/customFrameImages ONCE and reuse the same map across every
 * card, rather than reconciling (and re-inserting images) per card.
 */
async function importCardFromObjectWithFrameMap(
	data: FabkitFile,
	frameIdMap: Map<number, number>,
): Promise<void> {
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

	// Apply data migrations so imported files are upgraded to the current schema,
	// regardless of which app version exported them.
	const migratedState = applyStateMigrations(
		data.state,
		data.formatVersion ?? LEGACY_SCHEMA_VERSION,
	);

	// Custom-frame ids are local to the EXPORTING device and must never be
	// trusted as-is — remapCustomFrameId resolves each through frameIdMap
	// (built by reconcileImportedCustomFrames) and falls back to a reserved
	// sentinel, never the raw foreign id, when it collides with an unrelated
	// local frame. See UNRESOLVABLE_FOREIGN_FRAME_ID's doc comment.
	const [remappedCardBack, remappedCardBackRight] = await Promise.all([
		remapCustomFrameId(migratedState.CardBack, frameIdMap),
		remapCustomFrameId(migratedState.CardBackRight, frameIdMap),
	]);

	const card: StoredCard = {
		version: data.version,
		cardName: data.cardName,
		createdAt: data.createdAt || Date.now(),
		updatedAt: Date.now(),
		preview,
		state: {
			...(migratedState as unknown as SerializedCardState),
			CardArtwork: artwork,
			CardOverlay: overlay,
			CardBack: remappedCardBack,
			CardBackRight: remappedCardBackRight,
			meldHalfA: {
				...migratedState.meldHalfA,
				CardArtwork: meldHalfAArtwork,
			} as MeldHalf,
			meldHalfB: {
				...migratedState.meldHalfB,
				CardArtwork: meldHalfBArtwork,
			} as MeldHalf,
		},
		schemaVersion: __APP_VERSION__,
	};

	await db.cards.put(card);
}

export async function importCardFromObject(data: FabkitFile): Promise<void> {
	const frameIdMap = await reconcileImportedCustomFrames(
		data.customFrames,
		data.customFrameImages,
	);
	await importCardFromObjectWithFrameMap(data, frameIdMap);
	if (frameIdMap.size > 0) {
		await reloadCustomFrames();
		broadcastCustomFramesChanged();
	}
}

export async function importCardFromJSON(jsonString: string): Promise<void> {
	const data = JSON.parse(jsonString);
	if (!data.version || !data.cardName || !data.state) {
		throw new Error("Invalid card file format");
	}
	// Guard against truncated or empty state objects — a valid card always has a CardType.
	if (typeof data.state !== "object" || !("CardType" in data.state)) {
		throw new Error("Invalid card file: state is missing required fields");
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

export async function exportGalleryToFile(
	cards: StoredCard[],
	folders: StoredFolder[],
): Promise<void> {
	const [serialized, hoistedFrames] = await Promise.all([
		Promise.all(
			cards.map(async (card) => ({
				// includeCustomFrames: false — embedding happens once, hoisted,
				// below, not duplicated per card. See embedCustomFramesForCards.
				...(await exportCardToObject(card, { includeCustomFrames: false })),
				folderId: card.folderId,
			})),
		),
		embedCustomFramesForCards(
			cards.map((card) => ({
				CardBack: card.state.CardBack,
				CardBackRight: card.state.CardBackRight,
			})),
			true,
		),
	]);

	const gallery: FabgalleryFile = {
		format: "fabgallery",
		formatVersion: __APP_VERSION__,
		exportedAt: new Date().toISOString(),
		cardCount: serialized.length,
		cards: serialized,
		folders,
	};
	if (hoistedFrames) {
		gallery.customFrames = hoistedFrames.metas;
		gallery.customFrameImages = hoistedFrames.images;
	}

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

/**
 * Merge-imports a raw folder array (as found in a `.fabgallery` file — carrying
 * foreign ids that only mean something within that file) into the local folders
 * table. Walks the imported tree top-down; at each level, a folder is matched
 * against existing local folders by `(parentId, name)` — a match reuses the
 * existing folder's real local id, a miss creates it via `createFolder` (subject
 * to the same name/depth/uniqueness validation as manual creation).
 *
 * Returns a map from *imported* folder id to the *local* folder id it resolved
 * to, plus counts for the import summary. A folder that fails validation (name
 * too long, depth exceeded, etc.) is left unmapped, and its descendants are never
 * visited — the whole unresolved subtree's cards fall back to gallery root, per
 * the "cards whose folder can't be resolved land at root" contract.
 */
async function mergeFoldersByName(importedFolders: StoredFolder[]): Promise<{
	idMap: Map<string, string>;
	created: number;
	merged: number;
}> {
	const byImportedParent = new Map<string | undefined, StoredFolder[]>();
	for (const folder of importedFolders) {
		const siblings = byImportedParent.get(folder.parentId) ?? [];
		siblings.push(folder);
		byImportedParent.set(folder.parentId, siblings);
	}

	const idMap = new Map<string, string>();
	let created = 0;
	let merged = 0;

	async function resolveLevel(
		importedParentId: string | undefined,
		localParentId: string | undefined,
	): Promise<void> {
		const level = byImportedParent.get(importedParentId) ?? [];
		for (const folder of level) {
			const localSiblings = await db.folders
				.filter((f) => f.parentId === localParentId)
				.toArray();
			const match = localSiblings.find((f) => f.name === folder.name);

			let localId: string;
			if (match) {
				localId = match.id;
				merged++;
			} else {
				try {
					const createdFolder = await createFolder(folder.name, localParentId);
					localId = createdFolder.id;
					created++;
				} catch (error) {
					console.warn(
						`Skipping folder "${folder.name}" during merge import:`,
						error,
					);
					// Leave unmapped and don't descend — its subtree's cards land at root.
					continue;
				}
			}

			idMap.set(folder.id, localId);
			await resolveLevel(folder.id, localId);
		}
	}

	await resolveLevel(undefined, undefined);
	return { idMap, created, merged };
}

export async function importGalleryFromJSON(
	jsonString: string,
	mode: GalleryImportMode,
): Promise<GalleryImportResult> {
	const data = JSON.parse(jsonString);

	if (data?.format !== "fabgallery" || !Array.isArray(data.cards)) {
		throw new Error("Invalid gallery file format");
	}

	const gallery = data as FabgalleryFile;
	const importedFolders = gallery.folders ?? [];

	// Reconciled ONCE for the whole gallery (hoisted, per exportGalleryToFile)
	// rather than per card — a card entry's own customFrames/customFrameImages
	// are left undefined by the exporter, so per-card reconciliation here
	// would find nothing to do anyway; this is also what keeps a shared
	// image's decode+hash work from repeating once per card that uses it.
	const frameIdMap = await reconcileImportedCustomFrames(
		gallery.customFrames,
		gallery.customFrameImages,
	);

	if (mode === "replace") {
		await clearGallery();
		if (importedFolders.length > 0) {
			await db.folders.bulkAdd(importedFolders);
		}
		for (const card of gallery.cards) {
			await importCardFromObjectWithFrameMap(card, frameIdMap);
			if (card.folderId) {
				await moveCardToFolder(card.version, card.folderId);
			}
		}
		if (frameIdMap.size > 0) {
			await reloadCustomFrames();
			broadcastCustomFramesChanged();
		}
		return {
			imported: gallery.cards.length,
			skipped: 0,
			foldersCreated: importedFolders.length,
			foldersMerged: 0,
		};
	}

	const { idMap, created, merged } = await mergeFoldersByName(importedFolders);

	let imported = 0;
	let skipped = 0;
	for (const card of gallery.cards) {
		const existing = await getCard(card.version);
		if (existing) {
			skipped++;
			continue;
		}
		await importCardFromObjectWithFrameMap(card, frameIdMap);
		const localFolderId = card.folderId ? idMap.get(card.folderId) : undefined;
		if (localFolderId) {
			await moveCardToFolder(card.version, localFolderId);
		}
		imported++;
	}
	if (frameIdMap.size > 0) {
		await reloadCustomFrames();
		broadcastCustomFramesChanged();
	}
	return { imported, skipped, foldersCreated: created, foldersMerged: merged };
}
