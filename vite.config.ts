import { execSync } from "node:child_process";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import openGraphPlugin from "vite-plugin-open-graph";
import { VitePWA } from "vite-plugin-pwa";

const gitHash = execSync("git rev-parse HEAD").toString().trim();
const gitShortHash = execSync("git rev-parse --short HEAD").toString().trim();

// https://vite.dev/config/
export default defineConfig({
	define: {
		__GIT_HASH__: JSON.stringify(gitHash),
		__GIT_SHORT_HASH__: JSON.stringify(gitShortHash),
	},
	build: {
		sourcemap: true,
		rolldownOptions: {
			output: {
				advancedChunks: {
					groups: [{ name: "tiptap-emoji", test: /@tiptap\/extension-emoji/ }],
				},
			},
		},
	},
	plugins: [
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		babel({ presets: [reactCompilerPreset()] }),
		openGraphPlugin({
			basic: {
				siteName: "FABKIT",
				title: "FABKIT - Your Flesh and Blood Toolbox",
				description:
					"Flesh and Blood TCG tools built by the community, for the community. Browser-based, open source, no downloads required.",
				image: {
					url: "/fabkit_preview_image.png",
					width: 1200,
					height: 630,
					type: "image/png",
					alt: "FaBKit Preview Image",
				},
				url: "https://fabkit.io",
				type: "website",
			},
		}),
		VitePWA({
			registerType: "prompt",
			devOptions: {
				enabled: false,
			},
			workbox: {
				cleanupOutdatedCaches: true,
			},
			includeAssets: [
				"favicon.ico",
				"apple-touch-icon.png",
				"cardbacks/generated/683c9f087ee5f.png",
				"cardbacks/generated/683c9f087f497.png",
				"cardbacks/generated/683c9f087fa14.png",
				"cardbacks/generated/683c9f087ff25.png",
				"cardbacks/generated/683c9f088423a.png",
				"cardbacks/generated/683c9f08916d9.png",
				"cardbacks/generated/Blue-Token-Flat-688fb50e27c17.png",
				"cardbacks/generated/Fabled-Resource-1-Flat-688fb5868f0a2.png",
				"cardbacks/generated/Fabled-Resource-2-Flat-688fb5868fda2.png",
				"cardbacks/generated/Fabled-Resource-3-Flat-688fb5869028a.png",
				"cardbacks/generated/assassin-nostats-1-flat-6880352873107.png",
				"cardbacks/generated/assassin-nostats-2-flat-6880352873742.png",
				"cardbacks/generated/assassin-nostats-3-flat-6880352873c99.png",
				"cardbacks/generated/chaos-hero-flat-688038591517c.png",
				"cardbacks/generated/equipment-dented-683e107b17fab.png",
				"cardbacks/generated/equipment-flat-683e11f01cef0.png",
				"cardbacks/generated/fabled-resource-1-dented-683e109970027.png",
				"cardbacks/generated/fabled-resource-2-dented-683e10997022b.png",
				"cardbacks/generated/fabled-resource-3-dented-683e1099703da.png",
				"fonts/AmandaStd-Regular.svg",
				"fonts/AmandaStd-Regular.woff",
				"fonts/AmandaStd-Regular.woff2",
				"fonts/PalatinoLTStd-Roman.svg",
				"fonts/PalatinoLTStd-Roman.woff",
				"fonts/PalatinoLTStd-Roman.woff2",
				"fonts/dialog_cond_semibold_regular.svg",
				"fonts/dialog_cond_semibold_regular.woff",
				"fonts/dialog_cond_semibold_regular.woff2",
				"fonts/palatino_lt_std_black.svg",
				"fonts/palatino_lt_std_black.woff",
				"fonts/palatino_lt_std_black.woff2",
				"fonts/palatino_lt_std_black_italic.svg",
				"fonts/palatino_lt_std_black_italic.woff",
				"fonts/palatino_lt_std_black_italic.woff2",
				"fonts/palatino_lt_std_bold.svg",
				"fonts/palatino_lt_std_bold.woff",
				"fonts/palatino_lt_std_bold.woff2",
				"fonts/palatino_lt_std_bold_italic.svg",
				"fonts/palatino_lt_std_bold_italic.woff",
				"fonts/palatino_lt_std_bold_italic.woff2",
				"fonts/palatino_lt_std_italic.svg",
				"fonts/palatino_lt_std_italic.woff",
				"fonts/palatino_lt_std_italic.woff2",
				"fonts/palatino_lt_std_light.svg",
				"fonts/palatino_lt_std_light.woff",
				"fonts/palatino_lt_std_light.woff2",
				"fonts/palatino_lt_std_light_bold.svg",
				"fonts/palatino_lt_std_light_bold.woff",
				"fonts/palatino_lt_std_light_bold.woff2",
				"fonts/palatino_lt_std_light_italic.svg",
				"fonts/palatino_lt_std_light_italic.woff",
				"fonts/palatino_lt_std_light_italic.woff2",
				"fonts/palatino_lt_std_medium.svg",
				"fonts/palatino_lt_std_medium.woff",
				"fonts/palatino_lt_std_medium.woff2",
				"fonts/palatino_lt_std_medium_italic.svg",
				"fonts/palatino_lt_std_medium_italic.woff",
				"fonts/palatino_lt_std_medium_italic.woff2",
				"img/Lambstream.svg",
				"img/Thencros.svg",
				"img/rarities/rarity_basic.svg",
				"img/rarities/rarity_common.svg",
				"img/rarities/rarity_fabled.svg",
				"img/rarities/rarity_legendary.svg",
				"img/rarities/rarity_majestic.svg",
				"img/rarities/rarity_marvel.svg",
				"img/rarities/rarity_promo.svg",
				"img/rarities/rarity_rare.svg",
				"img/rarities/rarity_superrare.svg",
				"img/rarities/rarity_token.svg",
				"img/symbols/cardsymbol_defense.svg",
				"img/symbols/cardsymbol_life.svg",
				"img/symbols/cardsymbol_nocost.png",
				"img/symbols/cardsymbol_power.svg",
				"img/symbols/icon_chi.svg",
				"img/symbols/icon_cost.svg",
				"img/symbols/icon_def.svg",
				"img/symbols/icon_hp.svg",
				"img/symbols/icon_int.svg",
				"img/symbols/icon_pwr.svg",
				"img/symbols/icon_t.svg",
				"img/symbols/icon_u.svg",
			],
			manifest: {
				name: "FabKit",
				short_name: "FabKit",
				description: "Your Flesh and Blood Toolbox",
				theme_color: "#ffffff",
				icons: [
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
		}),
		visualizer({
			template: "treemap", // or sunburst
			open: false,
			gzipSize: true,
			brotliSize: true,
			filename: "analyse.html", // will be saved in project's root
		}),
	],
});
