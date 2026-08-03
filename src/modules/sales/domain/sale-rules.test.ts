import { describe, expect, it } from "vitest";
import { SaleError } from "./sale-errors";
import {
	validateCashReceived,
	validateOperationReference,
	validatePaymentAmount,
	validatePaymentTotal,
	validateSaleNumber,
	validateUniquePaymentMethods,
} from "./sale-rules";

describe("reglas de pagos", () => {
	it("valida suma exacta del total", () => {
		expect(() => validatePaymentTotal([500, 500], 1000)).not.toThrow();
		expect(() => validatePaymentTotal([500, 400], 1000)).toThrow(SaleError);
	});

	it("rechaza métodos duplicados", () => {
		expect(() => validateUniquePaymentMethods(["cash", "yape"])).not.toThrow();
		expect(() => validateUniquePaymentMethods(["cash", "cash"])).toThrow(
			expect.objectContaining({ code: "DUPLICATE_PAYMENT_METHOD" }),
		);
	});

	it("valida importe positivo", () => {
		expect(() => validatePaymentAmount(100)).not.toThrow();
		expect(() => validatePaymentAmount(0)).toThrow(SaleError);
		expect(() => validatePaymentAmount(-1)).toThrow(SaleError);
	});

	it("valida efectivo recibido suficiente", () => {
		expect(() => validateCashReceived(800, 1000)).not.toThrow();
		expect(() => validateCashReceived(800, 700)).toThrow(
			expect.objectContaining({ code: "CASH_RECEIVED_INSUFFICIENT" }),
		);
	});

	it("limpia referencia de operación", () => {
		expect(validateOperationReference(null)).toBeNull();
		expect(validateOperationReference("  ABC123  ")).toBe("ABC123");
		expect(validateOperationReference("")).toBeNull();
	});

	it("valida correlativo positivo", () => {
		expect(() => validateSaleNumber(1)).not.toThrow();
		expect(() => validateSaleNumber(0)).toThrow(SaleError);
	});
});
