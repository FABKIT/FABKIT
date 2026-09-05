import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import type { MockCard } from "@fabkit/apps/pack-opener/cards/mock-card";
import { drawMockCardFace } from "@fabkit/apps/pack-opener/cards/mock-card-texture";
import { useMemo } from "react";
import { CanvasTexture } from "three";

const TEXTURE_WIDTH = 512;
const TEXTURE_HEIGHT = 716;

const textureCache = new Map<string, CanvasTexture>();

/** Disposes every cached card texture from the previous pack — called when a
 * new pack starts, since only the current pack's textures are ever on
 * screen and packs aren't persisted between sessions. */
export function clearCardTextureCache(): void {
	for (const texture of textureCache.values()) {
		texture.dispose();
	}
	textureCache.clear();
}

/** This hook only ever runs for the mock/placeholder rendering path (see
 * Card3D's imageUrl branch) — real cards use useTexture(card.imageUrl)
 * instead. A ResolvedCard's wider real-data fields (numeric pitch,
 * nullable stats) never actually reach here in practice, but are narrowed
 * defensively so drawMockCardFace can keep MockCard's simpler, guaranteed
 * shape. */
function toMockCard(card: ResolvedCard): MockCard {
	return {
		id: card.id,
		name: card.name,
		rarity: card.rarity,
		foil: card.foil,
		marvel: card.marvel,
		pitch:
			card.pitch === 1 || card.pitch === 2 || card.pitch === 3
				? null
				: card.pitch,
		cost: card.cost ?? 0,
		power: card.power ?? 0,
		defense: card.defense ?? 0,
	};
}

export function useCardTexture(card: ResolvedCard): CanvasTexture {
	return useMemo(() => {
		const cached = textureCache.get(card.id);
		if (cached) return cached;

		const canvas = document.createElement("canvas");
		canvas.width = TEXTURE_WIDTH;
		canvas.height = TEXTURE_HEIGHT;
		const ctx = canvas.getContext("2d");
		if (ctx)
			drawMockCardFace(ctx, toMockCard(card), TEXTURE_WIDTH, TEXTURE_HEIGHT);

		const texture = new CanvasTexture(canvas);
		texture.needsUpdate = true;
		textureCache.set(card.id, texture);
		return texture;
	}, [card]);
}
