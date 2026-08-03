import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup/vitest-setup.ts"],
		include: ["src/**/*.test.{ts,tsx}"],
		exclude: ["node_modules", "e2e", "dist", ".tanstack"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["src/**/*.test.{ts,tsx}", "src/routeTree.gen.ts", "src/test/**", "src/**/*.d.ts"],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"#": path.resolve(__dirname, "./src"),
		},
	},
});
