import { describe, expect, it } from "vitest";
import { calculateSaleDraftTotals } from "./sale-totals";

describe("calculateSaleDraftTotals", () => {
	it("calcula totales para líneas válidas", () => {
		expect(
			calculateSaleDraftTotals([
				{ productId: "p1", quantity: 2, unitPriceCents: 350 },
				{ productId: "p2", quantity: 1, unitPriceCents: 500 },
			]),
		).toEqual({
			lineCount: 2,
			itemCount: 3,
			subtotalCents: 1200,
			totalCents: 1200,
		});
	});

	it("rechaza cantidad cero o negativa", () => {
		expect(() =>
			calculateSaleDraftTotals([{ productId: "p1", quantity: 0, unitPriceCents: 100 }]),
		).toThrow(RangeError);
	});

	it("rechaza precio inválido", () => {
		expect(() =>
			calculateSaleDraftTotals([{ productId: "p1", quantity: 1, unitPriceCents: -50 }]),
		).toThrow(RangeError);
	});

	it("devuelve ceros para carrito vacío", () => {
		expect(calculateSaleDraftTotals([])).toEqual({
			lineCount: 0,
			itemCount: 0,
			subtotalCents: 0,
			totalCents: 0,
		});
	});
});
