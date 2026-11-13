import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CARDBACKS_DIR = "public/cardbacks/generated";
const FONTS_DIR = "public/fonts";
const IMG_DIR = "public/img";
const VITE_CONFIG_PATH = "vite.config.ts";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
const FONT_EXTENSIONS = [".woff", ".woff2", ".ttf", ".otf", ".svg"];

/**
 * Image folders that stay out of the precache. Everything listed in
 * includeAssets is downloaded by every visitor's service worker, whichever
 * app they came for, and the pack opener's pack artwork and set logos are
 * several megabytes that only its own players ever see. They load on demand
 * instead. Its card back is small and stays precached.
 */
const IMG_PRECACHE_EXCLUDED_PREFIXES = [
	"img/pack-opener/packs/",
	"img/pack-opener/logos/",
];

function isPrecachedImage(file: string): boolean {
	return !IMG_PRECACHE_EXCLUDED_PREFIXES.some((prefix) =>
		file.startsWith(prefix),
	);
}

async function scanDirectoryRecursive(
	dir: string,
	baseDir: string,
	extensions: string[],
): Promise<string[]> {
	const results: string[] = [];

	try {
		const entries = await readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) {
				const subResults = await scanDirectoryRecursive(
					fullPath,
					baseDir,
					extensions,
				);
				results.push(...subResults);
			} else if (entry.isFile()) {
				if (extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
					// Convert to relative path from public/
					const relativePath = fullPath
						.replace(/\\/g, "/")
						.replace("public/", "");
					results.push(relativePath);
				}
			}
		}
	} catch (error) {
		console.error(error);

		// Directory doesn't exist or can't be read
		return [];
	}

	return results.sort();
}

async function getCardbackImages(): Promise<string[]> {
	try {
		const files = await readdir(CARDBACKS_DIR);
		return files
			.filter((file) =>
				IMAGE_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext)),
			)
			.map((file) => `cardbacks/generated/${file}`)
			.sort();
	} catch (error) {
		console.error(`Error reading cardbacks directory: ${error}`);
		return [];
	}
}

async function getFontFiles(): Promise<string[]> {
	try {
		const files = await readdir(FONTS_DIR);
		return files
			.filter((file) =>
				FONT_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext)),
			)
			.map((file) => `fonts/${file}`)
			.sort();
	} catch (error) {
		console.error(`Error reading fonts directory: ${error}`);
		return [];
	}
}

async function getImgFiles(): Promise<string[]> {
	try {
		const files = await scanDirectoryRecursive(
			IMG_DIR,
			IMG_DIR,
			IMAGE_EXTENSIONS,
		);
		return files.filter(isPrecachedImage);
	} catch (error) {
		console.error(`Error reading img directory: ${error}`);
		return [];
	}
}

async function updateViteConfig(
	cardbackPaths: string[],
	fontPaths: string[],
	imgPaths: string[],
): Promise<void> {
	const configContent = await readFile(VITE_CONFIG_PATH, "utf-8");

	// Find the includeAssets array
	const includeAssetsRegex = /includeAssets:\s*\[([\s\S]*?)\]/;
	const match = configContent.match(includeAssetsRegex);

	if (!match) {
		console.error("Could not find includeAssets array in vite.config.ts");
		process.exit(1);
	}

	// Build the new includeAssets array content
	const staticAssets = ["favicon.ico", "apple-touch-icon.png"];

	const allAssets = [
		...staticAssets,
		...cardbackPaths,
		...fontPaths,
		...imgPaths,
	];

	const newIncludeAssets = allAssets
		.map((asset) => `\t\t\t\t"${asset}"`)
		.join(",\n");

	const newConfig = configContent.replace(
		includeAssetsRegex,
		`includeAssets: [\n${newIncludeAssets}\n\t\t\t]`,
	);

	await writeFile(VITE_CONFIG_PATH, newConfig, "utf-8");
	console.log(
		`✅ Updated ${VITE_CONFIG_PATH} with ${cardbackPaths.length} cardback images, ${fontPaths.length} font files, and ${imgPaths.length} img files`,
	);
}

async function main() {
	console.log("🔍 Scanning for cardback images...");
	const cardbackImages = await getCardbackImages();

	console.log("🔍 Scanning for font files...");
	const fontFiles = await getFontFiles();

	console.log("🔍 Scanning for img files...");
	const imgFiles = await getImgFiles();

	if (cardbackImages.length === 0) {
		console.warn("⚠️  No cardback images found in public/cardbacks/generated");
	}

	if (fontFiles.length === 0) {
		console.warn("⚠️  No font files found in public/fonts");
	}

	if (imgFiles.length === 0) {
		console.warn("⚠️  No image files found in public/img");
	}

	if (
		cardbackImages.length === 0 &&
		fontFiles.length === 0 &&
		imgFiles.length === 0
	) {
		return;
	}

	console.log(`📦 Found ${cardbackImages.length} cardback images`);
	console.log(`📦 Found ${fontFiles.length} font files`);
	console.log(`📦 Found ${imgFiles.length} img files`);
	await updateViteConfig(cardbackImages, fontFiles, imgFiles);
	console.log("✨ Done!");
}

main().catch((error) => {
	console.error("❌ Error:", error);
	process.exit(1);
});
