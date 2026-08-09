import { describe, expect, it } from "vitest";
import type { SaleDetail } from "../../../application";
import { createVoidSaleFormValues, voidSaleFormValuesToInput } from "./void-sale-form.mappers";

const sale: SaleDetail = {
	id: "sale-1",
	saleNumber: 1,
	formattedSaleNumber: "V-000001",
	status: "completed",
	subtotalCents: 1_000,
	totalCents: 1_000,
	createdAt: 1,
	voidedAt: null,
	voidReason: null,
	cashSessionId: "cash-1",
	cashSessionStatus: "open",
	items: [],
	payments: [
		{
			id: "p1",
			method: "cash",
			amountCents: 400,
			status: "confirmed",
			providerLabel: null,
			operationReference: null,
			cashReceivedCents: 500,
			changeCents: 100,
			verifiedAt: 1,
			voidedAt: null,
			voidOperationReference: null,
		},
		{
			id: "p2",
			method: "yape",
			amountCents: 600,
			status: "manually_verified",
			providerLabel: "Yape",
			operationReference: "OP-1",
			cashReceivedCents: null,
			changeCents: null,
			verifiedAt: 1,
			voidedAt: null,
			voidOperationReference: null,
		},
	],
	inventoryMovements: [],
	voidEligibility: { eligible: true, reason: null },
};

describe("mapeadores del formulario de anulación", () => {
	it("reinicializa un arreglo exacto de pagos sin confirmaciones", () => {
		expect(createVoidSaleFormValues(sale).paymentReversals).toEqual([
			{
				paymentId: "p1",
				method: "cash",
				amountCents: 400,
				confirmed: false,
				reversalReference: "",
			},
			{
				paymentId: "p2",
				method: "yape",
				amountCents: 600,
				confirmed: false,
				reversalReference: "",
			},
		]);
	});

	it("mapea el preset y Otro con referencias fuera de la URL", () => {
		const values = createVoidSaleFormValues(sale);
		values.reasonPreset = "Otro";
		values.reasonDetails = "  Cliente canceló  ";
		const cashReversal = values.paymentReversals[0];
		const yapeReversal = values.paymentReversals[1];
		if (!cashReversal || !yapeReversal) throw new Error("Fixture de pagos incompleto");
		cashReversal.confirmed = true;
		yapeReversal.confirmed = true;
		yapeReversal.reversalReference = "  DEV-22  ";
		expect(voidSaleFormValuesToInput(sale.id, values)).toEqual({
			saleId: "sale-1",
			reason: "Cliente canceló",
			paymentReversals: [
				{ paymentId: "p1", confirmed: true, reversalReference: null },
				{ paymentId: "p2", confirmed: true, reversalReference: "DEV-22" },
			],
		});
	});
});
