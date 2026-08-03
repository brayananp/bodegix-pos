import { z } from "zod";

export const paymentMethodSchema = z.enum(["cash", "yape", "plin", "card", "bank_transfer"]);

function parseMoneyCents(value: string): number {
	const normalized = value.trim().replace(",", ".");
	const [wholePart = "0", decimalPart = ""] = normalized.split(".");
	return Number(wholePart) * 100 + Number(decimalPart.padEnd(2, "0").slice(0, 2));
}

export const checkoutPaymentSchema = z
	.object({
		key: z.string().min(1),
		method: paymentMethodSchema,
		amount: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, "Ingresa un importe válido (ej: 10.00)")
			.refine((v) => parseMoneyCents(v) > 0, "El importe debe ser mayor que cero"),
		cashReceived: z.string(),
		operationReference: z.string().max(80, "Máximo 80 caracteres"),
		manuallyVerified: z.boolean(),
	})
	.superRefine((payment, ctx) => {
		if (payment.method === "cash") {
			const amount = parseMoneyCents(payment.amount);
			const received = parseMoneyCents(payment.cashReceived || payment.amount);
			if (received < amount) {
				ctx.addIssue({
					code: "custom",
					message: "El efectivo recibido debe cubrir el importe en efectivo.",
					path: ["cashReceived"],
				});
			}
			return;
		}
		if (!payment.manuallyVerified) {
			ctx.addIssue({
				code: "custom",
				message: "Confirma que verificaste el pago en la aplicación o terminal oficial.",
				path: ["manuallyVerified"],
			});
		}
	});

export const saleCheckoutFormSchema = z
	.object({
		payments: z
			.array(checkoutPaymentSchema)
			.min(1, "Agrega al menos un método de pago")
			.max(5, "Máximo 5 métodos de pago"),
	})
	.superRefine((values, ctx) => {
		const methods = values.payments.map((p) => p.method);
		const unique = new Set(methods);
		if (unique.size !== methods.length) {
			ctx.addIssue({
				code: "custom",
				message: "No puedes usar el mismo método de pago dos veces.",
				path: ["payments"],
			});
		}
	});

/** Valida que la suma de pagos coincida con el total de la venta. */
export function validateCheckoutPaymentTotal(
	values: z.infer<typeof saleCheckoutFormSchema>,
	totalCents: number,
): string | undefined {
	const sum = values.payments.reduce((acc, p) => acc + parseMoneyCents(p.amount), 0);
	if (sum !== totalCents) {
		return sum < totalCents
			? `Faltan S/ ${((totalCents - sum) / 100).toFixed(2)} por asignar.`
			: `Los pagos exceden el total en S/ ${((sum - totalCents) / 100).toFixed(2)}.`;
	}
	return undefined;
}
