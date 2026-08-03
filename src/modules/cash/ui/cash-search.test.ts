import { describe, expect, it } from "vitest";
import { cashSearchSchema } from "./cash-search";

describe("cash search params", () => {
	it("aplica valores predeterminados", () => {
		expect(cashSearchSchema.parse({})).toEqual({
			tab: "current",
			panel: null,
			sessionId: null,
			page: 1,
			pageSize: 25,
		});
	});

	it("recupera valores inválidos sin interrumpir navegación", () => {
		expect(
			cashSearchSchema.parse({ tab: "bad", panel: "edit", page: -2, pageSize: 10 }),
		).toMatchObject({
			tab: "current",
			panel: null,
			page: 1,
			pageSize: 25,
		});
	});
});
