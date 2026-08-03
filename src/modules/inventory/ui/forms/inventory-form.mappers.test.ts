import { describe, expect, it } from "vitest";
import {
	initialStockFormValuesToInput,
	stockEntryFormValuesToInput,
	stockLossFormValuesToInput,
	stockReconciliationFormValuesToInput,
} from "./inventory-form.mappers";

describe("mapeadores de formularios de inventario", () => {
	it("convierte stock inicial a entero y nota vacía a null", () => {
		expect(initialStockFormValuesToInput("product-1", { quantity: "10", note: "  " })).toEqual({
			productId: "product-1",
			quantity: 10,
			note: null,
		});
	});

	it("limpia referencia y nota de una entrada", () => {
		expect(
			stockEntryFormValuesToInput("product-1", {
				quantity: "5",
				reference: " FAC-001 ",
				note: " Recepción ",
			}),
		).toEqual({
			productId: "product-1",
			quantity: 5,
			reference: "FAC-001",
			note: "Recepción",
		});
	});

	it("convierte conciliación y pérdida", () => {
		expect(
			stockReconciliationFormValuesToInput("product-1", {
				countedQuantity: "0",
				reason: " Conteo físico ",
			}),
		).toEqual({ productId: "product-1", countedQuantity: 0, reason: "Conteo físico" });
		expect(
			stockLossFormValuesToInput("product-1", {
				quantity: "2",
				lossType: "damaged",
				reason: "",
			}),
		).toEqual({ productId: "product-1", quantity: 2, lossType: "damaged", reason: null });
	});

	it.each(["", "1.5", "-1"])("rechaza cantidad no entera %s", (quantity) => {
		expect(() => initialStockFormValuesToInput("product-1", { quantity, note: "" })).toThrowError(
			expect.objectContaining({ code: "INVALID_STOCK_QUANTITY" }),
		);
	});

	it("exige motivo para otra pérdida", () => {
		expect(() =>
			stockLossFormValuesToInput("product-1", {
				quantity: "1",
				lossType: "other",
				reason: "",
			}),
		).toThrowError(expect.objectContaining({ code: "INVALID_LOSS_REASON" }));
	});
});
