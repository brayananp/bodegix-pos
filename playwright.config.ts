import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de Playwright para Bodegix POS.
 *
 * TanStack Start con Nitro genera un servidor Node en .output/server/index.mjs.
 * El puerto se controla con la variable de entorno PORT.
 *
 * Flujo recomendado:
 *   pnpm build          # genera .output/
 *   pnpm test:e2e       # levanta el servidor y corre los tests
 *
 * El webServer asume que .output/ ya existe (build previo).
 * En CI el job de E2E depende del job de check que ya hace build.
 */

const E2E_PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
	testDir: "./e2e",
	testIgnore: ["**/a11y/**", "**/performance/**", "**/pwa/**", "**/release/**"],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : 4,
	reporter: process.env.CI ? "github" : "html",

	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "mobile-chrome",
			use: { ...devices["Pixel 5"] },
		},
	],

	/**
	 * Levanta el servidor Nitro usando el build existente.
	 * No hace build aquí — debe haber un `pnpm build` previo.
	 * No reutiliza servidores: evita validar accidentalmente otra aplicación en el mismo puerto.
	 */
	webServer: {
		command: `cross-env PORT=${E2E_PORT} node .output/server/index.mjs`,
		url: BASE_URL,
		reuseExistingServer: false,
		timeout: 30_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
