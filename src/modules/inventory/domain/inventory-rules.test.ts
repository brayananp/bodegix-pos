import { describe, expect, it } from "vitest";
import { calculateInventoryTransition } from "./inventory-rules";

describe("calculateInventoryTransition", () => {
	it("registra stock inicial desde cero", () => {
		expect(calculateInventoryTransition(0, { kind: "initial", quantity: 10 })).toEqual({
			movementType: "initial_stock",
			quantityDelta: 10,
			stockBefore: 0,
			stockAfter: 10,
		});
	});

	it("suma una entrada al saldo actual", () => {
		expect(calculateInventoryTransition(8, { kind: "entry", quantity: 5 })).toEqual({
			movementType: "purchase",
			quantityDelta: 5,
			stockBefore: 8,
			stockAfter: 13,
		});
	});

	it.each([
		[15, 18, "adjustment_in", 3],
		[15, 12, "adjustment_out", -3],
	] as const)("concilia %i con conteo %i mediante %s", (currentStock, countedQuantity, movementType, quantityDelta) => {
		expect(
			calculateInventoryTransition(currentStock, { kind: "reconcile", countedQuantity }),
		).toEqual({
			movementType,
			quantityDelta,
			stockBefore: currentStock,
			stockAfter: countedQuantity,
		});
	});

	it("rechaza una conciliación sin diferencia", () => {
		expect(() =>
			calculateInventoryTransition(12, { kind: "reconcile", countedQuantity: 12 }),
		).toThrowError(expect.objectContaining({ code: "NO_STOCK_CHANGE" }));
	});

	it.each([
		["damaged", "damaged"],
		["expired", "expired"],
		["other", "adjustment_out"],
	] as const)("registra pérdida %s como %s", (lossType, movementType) => {
		expect(calculateInventoryTransition(10, { kind: "loss", quantity: 2, lossType })).toEqual({
			movementType,
			quantityDelta: -2,
			stockBefore: 10,
			stockAfter: 8,
		});
	});

	it("permite retirar todo el stock", () => {
		expect(
			calculateInventoryTransition(4, { kind: "loss", quantity: 4, lossType: "damaged" }),
		).toMatchObject({ quantityDelta: -4, stockAfter: 0 });
	});

	it("impide una pérdida superior al saldo", () => {
		expect(() =>
			calculateInventoryTransition(4, { kind: "loss", quantity: 5, lossType: "expired" }),
		).toThrowError(expect.objectContaining({ code: "INSUFFICIENT_STOCK" }));
	});

	it.each([
		[-1, { kind: "entry", quantity: 1 }],
		[0, { kind: "entry", quantity: 1.5 }],
		[0, { kind: "entry", quantity: -1 }],
		[0, { kind: "initial", quantity: 0 }],
		[3, { kind: "reconcile", countedQuantity: -1 }],
	] as const)("rechaza stock o cantidades no válidas", (stock, operation) => {
		expect(() => calculateInventoryTransition(stock, operation)).toThrowError(
			expect.objectContaining({ code: "INVALID_STOCK_QUANTITY" }),
		);
	});
});
