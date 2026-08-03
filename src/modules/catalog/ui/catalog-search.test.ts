import { describe, expect, it } from "vitest";
import { productsSearchSchema } from "./catalog-search";

describe("search params del catálogo", () => {
	it("aplica valores seguros por defecto", () => {
		expect(productsSearchSchema.parse({})).toEqual({
			tab: "products",
			q: "",
			status: "active",
			categoryId: null,
			page: 1,
			pageSize: 25,
			sort: "name-asc",
			panel: null,
			productId: null,
			categoryEditId: null,
		});
	});

	it("recupera parámetros malformados sin serializar formularios", () => {
		const parsed = productsSearchSchema.parse({
			tab: "unknown",
			status: "deleted",
			page: -4,
			pageSize: 10,
			sort: "price",
			panel: "inventario",
			name: "no debe conservarse",
		});
		expect(parsed).toMatchObject({
			tab: "products",
			status: "active",
			page: 1,
			pageSize: 25,
			sort: "name-asc",
			panel: null,
		});
		expect(parsed).not.toHaveProperty("name");
	});

	it("conserva un panel y filtros válidos", () => {
		expect(
			productsSearchSchema.parse({
				q: "001",
				status: "all",
				page: 2,
				pageSize: 50,
				panel: "product-detail",
				productId: "product-1",
			}),
		).toMatchObject({ q: "001", status: "all", page: 2, pageSize: 50, productId: "product-1" });
	});
});
