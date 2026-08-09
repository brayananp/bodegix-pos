import { describe, expect, it } from "vitest";
import { resolveSummaryDate, summarySearchSchema } from "./summary-search";

const NOW = Date.parse("2026-08-08T15:00:00Z");

describe("search params del resumen", () => {
	it("acepta fecha nullable y sección", () => {
		expect(summarySearchSchema.parse({ date: "2026-08-03", section: "cash" })).toEqual({
			date: "2026-08-03",
			section: "cash",
		});
	});

	it("recupera valores inválidos", () => {
		expect(summarySearchSchema.parse({ date: "ayer", section: "unknown" })).toEqual({
			date: null,
			section: "overview",
		});
	});

	it.each([null, "2026-02-30", "2026-08-09"])("resuelve %s como hoy", (value) => {
		expect(resolveSummaryDate(value, "America/Lima", NOW)).toBe("2026-08-08");
	});

	it("conserva una fecha pasada válida", () => {
		expect(resolveSummaryDate("2026-08-03", "America/Lima", NOW)).toBe("2026-08-03");
	});
});
