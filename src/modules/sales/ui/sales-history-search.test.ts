import { describe, expect, it } from "vitest";
import { resolveSalesDateRange, salesHistorySearchSchema } from "./sales-history-search";

describe("search params del historial", () => {
	it("aplica valores predeterminados y sanea valores inválidos", () => {
		expect(salesHistorySearchSchema.parse({})).toMatchObject({
			page: 1,
			pageSize: 25,
			status: "all",
			range: "today",
			panel: null,
		});
		expect(salesHistorySearchSchema.parse({ page: -1, pageSize: 10, status: "bad" })).toMatchObject(
			{ page: 1, pageSize: 25, status: "all" },
		);
	});

	it("resuelve un rango personalizado completo en America/Lima", () => {
		const search = salesHistorySearchSchema.parse({
			range: "custom",
			from: "2026-08-01",
			to: "2026-08-02",
		});
		expect(resolveSalesDateRange(search)).toEqual({
			fromDate: Date.parse("2026-08-01T05:00:00.000Z"),
			toDate: Date.parse("2026-08-03T05:00:00.000Z") - 1,
			error: null,
		});
	});

	it("rechaza un rango invertido y no serializa datos del formulario", () => {
		const parsed = salesHistorySearchSchema.parse({
			range: "custom",
			from: "2026-08-03",
			to: "2026-08-01",
			reason: "secreto",
			references: ["x"],
		});
		expect(resolveSalesDateRange(parsed).error).not.toBeNull();
		expect(parsed).not.toHaveProperty("reason");
		expect(parsed).not.toHaveProperty("references");
	});
});
