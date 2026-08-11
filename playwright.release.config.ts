import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.SMOKE_PORT ?? 4176);
const BASE_URL = `http://localhost:${PORT}`;
const browserProjects = [
	{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
	...(process.platform === "win32"
		? []
		: [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }]),
	{ name: "webkit", use: { ...devices["Desktop Safari"] } },
];

export default defineConfig({
	testDir: "./e2e/release",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: browserProjects,
	webServer: {
		command: `cross-env PORT=${PORT} node .output/server/index.mjs`,
		url: BASE_URL,
		reuseExistingServer: false,
		timeout: 30_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
