import { describe, expect, it } from "vitest";
import { checkSaleVoidEligibility, normalizeVoidReason, validatePaymentReversals } from ".";

const eligibleContext = {
	saleStatus: "completed" as const,
	saleVoidedAt: null,
	saleVoidReason: null,
	saleCashSessionId: "cash-1",
	originalSessionExists: true,
	originalSessionStatus: "open" as const,
	openSessionIds: ["cash-1"],
	hasItems: true,
	hasPayments: true,
};

describe("elegibilidad de anulación", () => {
	it("acepta solo una venta completa en su única sesión original abierta", () => {
		expect(checkSaleVoidEligibility(eligibleContext)).toEqual({ eligible: true, reason: null });
	});

	it.each([
		[{ ...eligibleContext, saleStatus: "voided" as const }, "SALE_ALREADY_VOIDED"],
		[{ ...eligibleContext, originalSessionExists: false }, "CASH_SESSION_NOT_FOUND"],
		[{ ...eligibleContext, originalSessionStatus: "closed" as const }, "CASH_SESSION_CLOSED"],
		[{ ...eligibleContext, openSessionIds: ["cash-2"] }, "DIFFERENT_OPEN_SESSION"],
		[{ ...eligibleContext, hasItems: false }, "SALE_DATA_INCONSISTENT"],
	])("rechaza el contexto inválido con razón estable", (context, reason) => {
		expect(checkSaleVoidEligibility(context)).toEqual({ eligible: false, reason });
	});
});

describe("reglas de anulación", () => {
	it("normaliza un motivo válido y rechaza vacío, corto o demasiado largo", () => {
		expect(normalizeVoidReason("  Cliente canceló  ")).toBe("Cliente canceló");
		expect(() => normalizeVoidReason(" ")).toThrowError(
			expect.objectContaining({ code: "SALE_VOID_REASON_REQUIRED" }),
		);
		expect(() => normalizeVoidReason("No")).toThrowError(
			expect.objectContaining({ code: "SALE_VOID_REASON_INVALID" }),
		);
		expect(() => normalizeVoidReason("x".repeat(241))).toThrowError(
			expect.objectContaining({ code: "SALE_VOID_REASON_INVALID" }),
		);
	});

	it("acepta exactamente una confirmación por pago y normaliza referencias", () => {
		expect(
			validatePaymentReversals(
				[
					{ paymentId: "cash", confirmed: true, reversalReference: null },
					{ paymentId: "yape", confirmed: true, reversalReference: "  DEV-123  " },
				],
				["cash", "yape"],
			),
		).toEqual(
			new Map([
				["cash", null],
				["yape", "DEV-123"],
			]),
		);
	});

	it.each([
		[
			[{ paymentId: "cash", confirmed: false, reversalReference: null }],
			["cash"],
			"PAYMENT_REVERSAL_CONFIRMATION_REQUIRED",
		],
		[[], ["cash"], "PAYMENT_REVERSAL_MISMATCH"],
		[
			[{ paymentId: "extra", confirmed: true, reversalReference: null }],
			["cash"],
			"PAYMENT_REVERSAL_MISMATCH",
		],
		[
			[
				{ paymentId: "cash", confirmed: true, reversalReference: null },
				{ paymentId: "cash", confirmed: true, reversalReference: null },
			],
			["cash"],
			"PAYMENT_REVERSAL_MISMATCH",
		],
		[
			[{ paymentId: "cash", confirmed: true, reversalReference: "x".repeat(81) }],
			["cash"],
			"INVALID_REVERSAL_REFERENCE",
		],
	] as const)("rechaza confirmaciones o referencias inválidas", (reversals, expected, code) => {
		expect(() => validatePaymentReversals(reversals, expected)).toThrowError(
			expect.objectContaining({ code }),
		);
	});
});
