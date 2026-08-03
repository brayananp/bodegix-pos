import { describe, expect, it } from "vitest";
import { inventorySearchSchema } from "./inventory-search";

describe("search params de inventario", () => {
	it("aplica valores seguros por defecto", () => {
		expect(inventorySearchSchema.parse({})).toEqual({
			tab: "stock",
			q: "",
			productStatus: "active",
			stockStatus: "all",
			categoryId: null,
			movementType: "all",
			page: 1,
			pageSize: 25,
			sort: "name-asc",
			panel: null,
			productId: null,
		});
	});

	it("recupera parámetros malformados y descarta valores de formulario", () => {
		const parsed = inventorySearchSchema.parse({
			tab: "unknown",
			productStatus: "deleted",
			stockStatus: "negative",
			movementType: "sale",
			page: 0,
			pageSize: 10,
			sort: "price",
			panel: "edit",
			quantity: "99",
		});
		expect(parsed).toMatchObject({
			tab: "stock",
			productStatus: "active",
			stockStatus: "all",
			movementType: "all",
			page: 1,
			pageSize: 25,
			sort: "name-asc",
			panel: null,
		});
		expect(parsed).not.toHaveProperty("quantity");
	});
});
