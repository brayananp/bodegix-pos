import { describe, expect, it } from "vitest";
import { saleSearchSchema } from "./sale-search";

describe("search params de venta", () => {
	it("aplica valores seguros por defecto", () => {
		expect(saleSearchSchema.parse({})).toEqual({
			q: "",
			categoryId: null,
			panel: null,
			saleId: null,
		});
	});

	it("recupera parámetros malformados sin serializar carrito ni pagos", () => {
		const parsed = saleSearchSchema.parse({
			q: "coca",
			categoryId: "cat-1",
			panel: "invalid",
			saleId: "sale-1",
			payments: [{ method: "cash" }],
			cart: [{ productId: "p1" }],
		});
		expect(parsed).toEqual({
			q: "coca",
			categoryId: "cat-1",
			panel: null,
			saleId: "sale-1",
		});
		expect(parsed).not.toHaveProperty("payments");
		expect(parsed).not.toHaveProperty("cart");
	});

	it("conserva panel y resultado válidos", () => {
		expect(saleSearchSchema.parse({ panel: "checkout", saleId: null })).toMatchObject({
			panel: "checkout",
		});
		expect(saleSearchSchema.parse({ panel: "result", saleId: "sale-abc" })).toMatchObject({
			panel: "result",
			saleId: "sale-abc",
		});
	});
});
