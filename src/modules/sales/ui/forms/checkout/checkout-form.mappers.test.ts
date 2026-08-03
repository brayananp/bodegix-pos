import { describe, expect, it } from "vitest";
import {
	calculateChangeCents,
	calculateRemainingCents,
	checkoutValuesToPaymentIntents,
	createDefaultCheckoutValues,
} from "./checkout-form.mappers";

describe("checkout form mappers", () => {
	it("crea valores predeterminados con efectivo cubriendo el total", () => {
		const values = createDefaultCheckoutValues(2000);
		expect(values.payments).toHaveLength(1);
		expect(values.payments[0]).toMatchObject({
			method: "cash",
			amount: "20.00",
			cashReceived: "20.00",
		});
	});

	it("convierte valores a intents de pago", () => {
		const intents = checkoutValuesToPaymentIntents({
			payments: [
				{
					key: "k1",
					method: "cash",
					amount: "8.00",
					cashReceived: "10.00",
					operationReference: "",
					manuallyVerified: false,
				},
				{
					key: "k2",
					method: "yape",
					amount: "12.00",
					cashReceived: "",
					operationReference: "OP123",
					manuallyVerified: true,
				},
			],
		});
		expect(intents).toEqual([
			{
				method: "cash",
				amountCents: 800,
				cashReceivedCents: 1000,
				operationReference: null,
				manuallyVerified: false,
			},
			{
				method: "yape",
				amountCents: 1200,
				cashReceivedCents: null,
				operationReference: "OP123",
				manuallyVerified: true,
			},
		]);
	});

	it("calcula importe restante", () => {
		expect(
			calculateRemainingCents(2000, [
				{
					key: "k1",
					method: "cash",
					amount: "8.00",
					cashReceived: "8.00",
					operationReference: "",
					manuallyVerified: false,
				},
			]),
		).toBe(1200);
	});

	it("calcula vuelto en efectivo", () => {
		expect(
			calculateChangeCents({
				key: "k1",
				method: "cash",
				amount: "8.00",
				cashReceived: "10.00",
				operationReference: "",
				manuallyVerified: false,
			}),
		).toBe(200);
	});
});
