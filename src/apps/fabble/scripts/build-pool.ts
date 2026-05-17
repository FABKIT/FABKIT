/**
 * Pool generation script. Run with: bun run build:pool
 *
 * Reads:  @flesh-and-blood/cards (devDependency — never bundled into runtime app)
 * Writes: public/pool-standard.json
 * Writes: public/pool-chaos.json
 *
 * Standard pool rule: all non-excluded, non-expansion-slot, non-banned cards
 * regardless of rarity.
 *
 * Decision #7: Pool version = "{@flesh-and-blood/cards npm version}-{YYYYMMDD}"
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cards } from "@flesh-and-blood/cards";
import type { Card as RawCard } from "@flesh-and-blood/types";
import pkg from "../../../package.json" with { type: "json" };
import { FAB_CDN_BASE } from "../lib/constants";
import {
	filterForChaos,
	filterForStandard,
	groupByName,
	uniformPopularityProvider,
} from "../lib/pool";
import { findCollisions } from "../lib/solver";

// ─── Version string ───────────────────────────────────────────────────────────
// Format: "{@flesh-and-blood/cards version}-{YYYYMMDD}" (Decision #7)
// Version read from package.json devDependencies — no manual sync needed.
// UTC date — consistent regardless of build machine timezone.
const FAB_CARDS_VERSION = (
	pkg.devDependencies["@flesh-and-blood/cards"] as string
).replace(/^\^/, "");
const buildDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const POOL_VERSION = `${FAB_CARDS_VERSION}-${buildDate}`;

// ─── Build Standard pool ──────────────────────────────────────────────────────
console.log("[build-pool] Filtering Standard pool...");
const standardRaw = filterForStandard(cards as unknown as RawCard[]);
const standardAll = groupByName(
	standardRaw as unknown as RawCard[],
	uniformPopularityProvider,
);

// Collision check
const standardCollisions = findCollisions(standardAll);
if (standardCollisions.length > 0) {
	console.warn(
		`[build-pool] ${standardCollisions.length} fingerprint collisions in Standard pool:`,
	);
	for (const { names } of standardCollisions) {
		console.warn(`  - ${names.join(" / ")}`);
	}
}
// Mark all cards in a collision group as ambiguous — they're kept in the pool
// so players can search and guess them, but they're never picked as a daily answer.
const standardAmbiguousNames = new Set(
	standardCollisions.flatMap((c) => c.names),
);
const standardClean = standardAll.map((c) =>
	standardAmbiguousNames.has(c.name) ? { ...c, isAmbiguous: true } : c,
);

// ─── Build Chaos pool ─────────────────────────────────────────────────────────
console.log("[build-pool] Filtering Chaos pool...");
const chaosRaw = filterForChaos(cards as unknown as RawCard[]);
const chaosAll = groupByName(
	chaosRaw as unknown as RawCard[],
	uniformPopularityProvider,
);

const chaosCollisions = findCollisions(chaosAll);
if (chaosCollisions.length > 0) {
	console.warn(
		`[build-pool] ${chaosCollisions.length} fingerprint collisions in Chaos pool:`,
	);
	for (const { names } of chaosCollisions) {
		console.warn(`  - ${names.join(" / ")}`);
	}
}
const chaosAmbiguousNames = new Set(
	chaosCollisions.flatMap((c) => c.names),
);
const chaosClean = chaosAll.map((c) =>
	chaosAmbiguousNames.has(c.name) ? { ...c, isAmbiguous: true } : c,
);

// ─── Write output ─────────────────────────────────────────────────────────────
const outDir = resolve(import.meta.dir, "../../../public");

writeFileSync(
	resolve(outDir, "pool-standard.json"),
	JSON.stringify({ version: POOL_VERSION, pool: standardClean }, null, 0),
	"utf-8",
);

writeFileSync(
	resolve(outDir, "pool-chaos.json"),
	JSON.stringify({ version: POOL_VERSION, pool: chaosClean }, null, 0),
	"utf-8",
);

console.log(`[build-pool] Standard pool: ${standardClean.length} cards`);
console.log(`[build-pool] Chaos pool: ${chaosClean.length} cards`);
console.log(`[build-pool] Version: ${POOL_VERSION}`);
console.log(`[build-pool] Output: ${outDir}`);

// ─── Sample CDN image URL for verification ────────────────────────────────────
if (standardClean.length > 0) {
	const sample = standardClean[0];
	if (sample.pitchVariants.length > 0) {
		const img = sample.pitchVariants[0].defaultImage;
		console.log(`[build-pool] Sample CDN URL: ${FAB_CDN_BASE}${img}.webp`);
	}
}
