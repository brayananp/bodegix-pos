import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PERFORMANCE_PORT ?? 4177);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: "./e2e/performance",
	fullyParallel: false,
	workers: 1,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	reporter: process.env.CI ? "github" : "list",
	timeout: 600_000,
	use: { ...devices["Desktop Chrome"], baseURL: BASE_URL, trace: "off" },
	webServer: {
		command: `cross-env PORT=${PORT} node .output/server/index.mjs`,
		url: BASE_URL,
		reuseExistingServer: false,
		timeout: 30_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
