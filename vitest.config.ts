import path from "node:path";
import { defineConfig } from "vitest/config";
import { getBuildMetadata } from "./scripts/build-metadata.ts";

const buildMetadata = getBuildMetadata();

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(buildMetadata.version),
		__BUILD_METADATA__: JSON.stringify(buildMetadata),
	},
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
			"virtual:pwa-register/react": path.resolve(
				__dirname,
				"./src/test/mocks/pwa-register-react.ts",
			),
			"@": path.resolve(__dirname, "./src"),
			"#": path.resolve(__dirname, "./src"),
		},
	},
});
