import Dexie, { type Table } from "dexie";
import type { StoredCard, StoredFolder } from "./card-storage.ts";
import type {
	StoredCustomFrame,
	StoredFrameImage,
} from "./custom-frames-storage.ts";

/**
 * Dexie instance, extracted from card-storage.ts so future persistence modules
 * (e.g. custom-frames-storage.ts) can depend on `db` without importing
 * card-storage.ts itself — that would create a cycle, since card-storage.ts
 * needs to depend on the custom-frames registry to resolve stored frame ids.
 */
class FabkitDatabase extends Dexie {
	cards!: Table<StoredCard, string>;
	folders!: Table<StoredFolder, string>;
	frameImages!: Table<StoredFrameImage, string>;
	customFrames!: Table<StoredCustomFrame, number>;

	constructor() {
		super("fabkit-cards");

		// Version 1: initial schema — matches the live IndexedDB exactly.
		// IMPORTANT: Never modify this block. Add new version() calls below it.
		this.version(1).stores({
			cards: "version, cardName, createdAt, updatedAt",
		});

		// Version 2: gallery folders. Purely additive — `folders` is a new table,
		// and `folderId` on `cards` is optional (absent = gallery root on both old
		// and new records), so no `.upgrade()` data transform is needed. This is a
		// Dexie table/index schema change, distinct from the MIGRATIONS array in
		// card-storage.ts (which migrates SerializedCardState shape, not IndexedDB
		// schema).
		this.version(2).stores({
			cards: "version, cardName, createdAt, updatedAt, folderId",
			folders: "id, parentId, name, createdAt, updatedAt",
		});

		// Version 3: user-uploaded card frames. Purely additive — two new tables,
		// no change to `cards`, so no .upgrade() data transform is needed.
		//
		// NOTE: `customFrames.id` is a MANUAL primary key — declared as plain
		// `id`, deliberately NOT `++id`. Dexie's auto-increment cannot produce
		// negative values, and the negative id space is what discriminates
		// custom frames from positive stock manifest ids (see
		// custom-frames-storage.ts's allocateCustomFrameId). Do not "fix" this
		// to ++id.
		this.version(3).stores({
			cards: "version, cardName, createdAt, updatedAt, folderId",
			folders: "id, parentId, name, createdAt, updatedAt",
			frameImages: "payloadHash, sourceHash, createdAt",
			customFrames: "id, payloadHash, name, type, createdAt, updatedAt",
		});
	}
}

export const db = new FabkitDatabase();
