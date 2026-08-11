import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const packageJson = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
	version: string;
};

const PWA_THEME_COLOR = "#16a34a";
const PWA_BACKGROUND_COLOR = "#ffffff";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version),
	},
	plugins: [
		devtools(),
		VitePWA({
			outDir: ".output/public",
			strategies: "generateSW",
			registerType: "prompt",
			injectRegister: null,
			includeManifestIcons: false,
			manifest: {
				id: "/",
				name: "Bodegix POS",
				short_name: "Bodegix",
				description: "Punto de venta offline-first para bodegas.",
				lang: "es-PE",
				dir: "ltr",
				start_url: "/sale",
				scope: "/",
				display: "standalone",
				orientation: "any",
				theme_color: PWA_THEME_COLOR,
				background_color: PWA_BACKGROUND_COLOR,
				icons: [
					{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
					{ src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
					{
						src: "/pwa-maskable-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
				shortcuts: [
					{ name: "Nueva venta", short_name: "Venta", url: "/sale" },
					{ name: "Inventario", short_name: "Inventario", url: "/inventory" },
					{ name: "Caja", short_name: "Caja", url: "/cash" },
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
				globIgnores: ["**/*.map", "**/*.bodegix"],
				additionalManifestEntries: [{ url: "/", revision: packageJson.version }],
				navigateFallback: "/",
				navigateFallbackAllowlist: [
					/^\/(?:sale|products|inventory|cash|sales|summary|settings)?\/?$/,
				],
				cleanupOutdatedCaches: true,
				clientsClaim: false,
				skipWaiting: false,
			},
			devOptions: { enabled: false },
		}),
		nitro({ rollupConfig: { external: [/^@sentry\//] } }),
		tailwindcss(),
		tanstackStart({
			spa: {
				enabled: true,
			},
		}),
		viteReact(),
	],
});

export default config;
