import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REAL_SET_PACK_CONFIGS } from "../../src/apps/pack-opener/pack/set-configs";
import type { CardRarity } from "../../src/shared/config/cards/rarities";
import type { FabSetPrintings } from "../../src/shared/data/fab-printings";

/**
 * Hard gate from the execution plan, section 5.2: every rarity a real
 * set's PackConfig can draw must actually be fillable from that set's own
 * real printing pool. A config that declares a slot LSS's own pool can't
 * fill silently falls back to placeholder art mid-pack — this test exists
 * so that fails the build instead, per the plan's explicit instruction.
 *
 * Reads the generated per-set JSON directly from disk rather than going
 * through shared/data/fab-printings.ts's loadSetPrintings(), which fetches
 * over HTTP and assumes a browser/dev-server origin — not available here.
 * Requires `bun run build-pack-data` to have been run first (wired into
 * CI ahead of the Test step — see .github/workflows/ci.yml).
 */

const DATA_DIR = join(process.cwd(), "public", "data", "pack-opener", "sets");

function loadSetPrintings(code: string): FabSetPrintings {
	const raw = readFileSync(join(DATA_DIR, `${code}.json`), "utf-8");
	return JSON.parse(raw) as FabSetPrintings;
}

function poolSize(
	data: FabSetPrintings,
	rarity: CardRarity,
	expansionSlot: boolean,
): number {
	return data.printings.filter(
		(p) => p.rarity === rarity && p.expansionSlot === expansionSlot,
	).length;
}

describe("pool viability", () => {
	for (const [code, config] of Object.entries(REAL_SET_PACK_CONFIGS)) {
		describe(code, () => {
			const data = loadSetPrintings(code);

			it("every declared rarity/expansion-slot combination has a non-empty real pool", () => {
				const empty: string[] = [];
				for (const slot of config.slots) {
					for (const entry of slot.rarityTable) {
						const size = poolSize(
							data,
							entry.rarity,
							Boolean(entry.expansionSlot),
						);
						if (size === 0) {
							empty.push(
								`slot "${slot.kind}" -> rarity "${entry.rarity}"` +
									(entry.expansionSlot ? " (expansion slot)" : ""),
							);
						}
					}
				}
				expect(empty).toEqual([]);
			});

			it("its declared slot counts sum to its own cardsPerPack", () => {
				const sum = config.slots.reduce((total, slot) => total + slot.count, 0);
				expect(sum).toBe(config.cardsPerPack);
			});
		});
	}
});
