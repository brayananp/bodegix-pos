import { describe, expect, it } from "vitest";
import {
	calculateCashDifference,
	calculateExpectedCash,
	getCashDifferenceStatus,
	normalizeMovementReason,
	validateCountedCash,
	validateMovementAmount,
	validateOpeningCash,
} from ".";

describe("reglas y cálculos de caja", () => {
	it.each([
		[
			{ openingCashCents: 0, cashSalesCents: 0, manualDepositsCents: 0, manualWithdrawalsCents: 0 },
			0,
		],
		[
			{
				openingCashCents: 10_000,
				cashSalesCents: 0,
				manualDepositsCents: 2_000,
				manualWithdrawalsCents: 3_000,
			},
			9_000,
		],
		[
			{
				openingCashCents: 10_000,
				cashSalesCents: 5_500,
				manualDepositsCents: 500,
				manualWithdrawalsCents: 1_000,
			},
			15_000,
		],
	] as const)("calcula efectivo esperado", (input, expected) => {
		expect(calculateExpectedCash(input)).toBe(expected);
	});

	it.each([
		[10_000, 10_000, 0, "balanced"],
		[10_000, 10_500, 500, "surplus"],
		[10_000, 9_500, -500, "shortage"],
	] as const)("calcula e interpreta la diferencia", (expected, counted, difference, status) => {
		expect(calculateCashDifference(expected, counted)).toBe(difference);
		expect(getCashDifferenceStatus(difference)).toBe(status);
	});

	it("rechaza importes negativos, decimales y un resultado esperado negativo", () => {
		expect(() => validateOpeningCash(-1)).toThrow(/inicial/i);
		expect(() => validateOpeningCash(1.5)).toThrow(/inicial/i);
		expect(() => validateCountedCash(-1)).toThrow(/contado/i);
		expect(() => validateMovementAmount(0)).toThrow(/mayor que cero/i);
		expect(() => validateMovementAmount(1.5)).toThrow(/mayor que cero/i);
		expect(() =>
			calculateExpectedCash({
				openingCashCents: 0,
				cashSalesCents: 0,
				manualDepositsCents: 0,
				manualWithdrawalsCents: 1,
			}),
		).toThrow(/consistente/i);
	});

	it("normaliza motivos y exige entre 3 y 160 caracteres", () => {
		expect(normalizeMovementReason("  Agregar sencillo  ")).toBe("Agregar sencillo");
		expect(() => normalizeMovementReason("no")).toThrow(/motivo/i);
		expect(() => normalizeMovementReason("x".repeat(161))).toThrow(/motivo/i);
	});
});
