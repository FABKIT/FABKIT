import { existsSync } from "node:fs";
import { join } from "node:path";

/** Whether the generated pack data these tests read is present. index.json is
 * written last by scripts/build-pack-data.ts, so it marks a finished build.
 * Missing data skips the test locally with instructions, but fails outright in
 * CI, where the data step has run and a missing file means a real break. */
export function hasPackData(): boolean {
	const present = existsSync(
		join(process.cwd(), "public", "data", "pack-opener", "index.json"),
	);
	if (present) return true;
	if (process.env.CI) {
		throw new Error(
			"Generated pack data is missing; CI should have built it with `bun run build-pack-data`.",
		);
	}
	console.warn(
		"Skipping tests that need generated pack data. Run `bun run build-pack-data` to include them.",
	);
	return false;
}
