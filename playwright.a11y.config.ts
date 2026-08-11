import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.A11Y_PORT ?? 4175);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: "./e2e/a11y",
	fullyParallel: false,
	workers: 1,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		...devices["Desktop Chrome"],
		baseURL: BASE_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	webServer: {
		command: `cross-env PORT=${PORT} node .output/server/index.mjs`,
		url: BASE_URL,
		reuseExistingServer: false,
		timeout: 30_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
