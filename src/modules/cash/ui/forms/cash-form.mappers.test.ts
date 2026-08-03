import { describe, expect, it } from "vitest";
import {
	cashMovementFormValuesToInput,
	closeCashFormValuesToInput,
	moneyPreview,
	openCashFormValuesToInput,
} from "./cash-form.mappers";

describe("mapeadores de formularios de caja", () => {
	it("convierte strings monetarios a céntimos sin coma flotante", () => {
		expect(openCashFormValuesToInput({ openingCash: "100,50" })).toEqual({
			openingCashCents: 10_050,
		});
		expect(closeCashFormValuesToInput("cash-1", { countedCash: "0" })).toEqual({
			cashSessionId: "cash-1",
			countedCashCents: 0,
		});
		expect(
			cashMovementFormValuesToInput("cash-1", { amount: "20.05", reason: "  Agregar sencillo  " }),
		).toEqual({ cashSessionId: "cash-1", amountCents: 2_005, reason: "Agregar sencillo" });
	});

	it("tolera estados parciales solo en la vista previa", () => {
		expect(moneyPreview("")).toBeNull();
		expect(moneyPreview("10.")).toBeNull();
		expect(moneyPreview("10.5")).toBe(1_050);
	});

	it("rechaza dinero y motivos inválidos", () => {
		expect(() => openCashFormValuesToInput({ openingCash: "-1" })).toThrow();
		expect(() => cashMovementFormValuesToInput("cash-1", { amount: "0", reason: "ok" })).toThrow();
	});
});
