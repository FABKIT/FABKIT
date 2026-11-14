/** the-fab-cube's card.json shapes, shared by the build script and the
 * pre-release bridge that maps another schema onto them. */

export interface RawPrinting {
	id: string;
	set_id: string;
	rarity: string;
	foiling: string;
	/** "A" / "F" / "U" / "N" — carried through as FabPrinting.edition. */
	edition: string;
	expansion_slot: boolean;
	tcgplayer_product_id: string | null;
	/** This printing's own true identity — unlike `id` (the collector
	 * number, e.g. "SEA001"), which a card and its Marvel version share.
	 * Carried through as FabPrinting.uniqueId. */
	unique_id: string;
	/** e.g. ["FA"] on a Marvel/full-art printing. Carried through as
	 * FabPrinting.artVariations — see printingImageUrl's own comment in
	 * fab-printings.ts for what this is used for. */
	art_variations: string[];
	/** The real artwork filename this printing actually renders with —
	 * differs from `id` for Marvel printings (e.g. SEA001's Marvel version
	 * is SEA001-MV). Optional/nullable defensively: not every printing in
	 * the upstream data is guaranteed to carry one. */
	image_url?: string | null;
	/** Present only on the ~500 booster-set printings that are one face of
	 * a double-faced card. `other_face_unique_id` addresses the OTHER
	 * face's printing, which is what build-pack-data.ts's backSlugFor()
	 * resolves. */
	double_sided_card_info?: {
		other_face_unique_id: string;
		is_DFC: boolean;
	}[];
}

export interface RawCard {
	name: string;
	pitch: string;
	cost: string;
	power: string;
	defense: string;
	types: string[];
	printings: RawPrinting[];
}
