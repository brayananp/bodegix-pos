import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { getBuildMetadata } from "./scripts/build-metadata.ts";

const packageJson = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
	version: string;
};
const buildMetadata = getBuildMetadata();

const PWA_THEME_COLOR = "#16a34a";
const PWA_BACKGROUND_COLOR = "#ffffff";
const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"form-action 'self'",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob:",
	"font-src 'self'",
	"connect-src 'self'",
	"manifest-src 'self'",
	"worker-src 'self' blob:",
].join("; ");

const SECURITY_HEADERS = {
	"Content-Security-Policy": CONTENT_SECURITY_POLICY,
	"Cross-Origin-Opener-Policy": "same-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
};

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	build: {
		// Production source maps stay private unless a future release pipeline stores them securely.
		sourcemap: false,
	},
	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version),
		__BUILD_METADATA__: JSON.stringify(buildMetadata),
	},
	plugins: [
		devtools({ removeDevtoolsOnBuild: true }),
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
		nitro({
			preset: "node-server",
			rollupConfig: { external: [/^@sentry\//] },
			routeRules: { "/**": { headers: SECURITY_HEADERS } },
		}),
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
