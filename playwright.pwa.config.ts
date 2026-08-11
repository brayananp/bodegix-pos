import { defineConfig, devices } from "@playwright/test";

const PWA_PORT = Number(process.env.PWA_PORT ?? 4174);
const BASE_URL = `http://localhost:${PWA_PORT}`;

export default defineConfig({
	testDir: "./e2e/pwa",
	fullyParallel: false,
	workers: 1,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	timeout: 120_000,
	use: {
		...devices["Desktop Chrome"],
		baseURL: BASE_URL,
		actionTimeout: 15_000,
		navigationTimeout: 15_000,
		serviceWorkers: "allow",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	webServer: {
		command: `cross-env PORT=${PWA_PORT} node .output/server/index.mjs`,
		url: BASE_URL,
		reuseExistingServer: false,
		timeout: 30_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
