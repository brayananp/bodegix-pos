import { describe, expect, it } from "vitest";
import { getInventoryStockStatus } from "./inventory-status";

describe("getInventoryStockStatus", () => {
	it.each([
		[0, 5, "out_of_stock"],
		[1, 5, "low_stock"],
		[5, 5, "low_stock"],
		[6, 5, "in_stock"],
		[1, 0, "in_stock"],
	] as const)("clasifica stock %i con mínimo %i como %s", (stock, minimum, expected) => {
		expect(getInventoryStockStatus(stock, minimum)).toBe(expected);
	});

	it("rechaza cantidades negativas o decimales", () => {
		expect(() => getInventoryStockStatus(-1, 0)).toThrowError(
			expect.objectContaining({ code: "INVALID_STOCK_QUANTITY" }),
		);
		expect(() => getInventoryStockStatus(1.5, 1)).toThrowError(
			expect.objectContaining({ code: "INVALID_STOCK_QUANTITY" }),
		);
	});
});
