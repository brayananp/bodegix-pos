import { describe, expect, it } from "vitest";
import { isStaleChunkError } from "./is-stale-chunk-error";

describe("isStaleChunkError", () => {
	it.each([
		new TypeError("Failed to fetch dynamically imported module"),
		new Error("ChunkLoadError: Loading chunk 42 failed"),
		"Importing a module script failed",
	])("reconoce errores de assets de una versión anterior", (error) => {
		expect(isStaleChunkError(error)).toBe(true);
	});

	it("no confunde errores funcionales", () => {
		expect(isStaleChunkError(new Error("Stock insuficiente"))).toBe(false);
	});
});
