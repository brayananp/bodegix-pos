import { z } from "zod";

const moneyPattern = /^\d+(?:[.,]\d{1,2})?$/;

export const nonNegativeMoneySchema = z
	.string()
	.trim()
	.regex(moneyPattern, "Escribe un importe válido con máximo 2 decimales.")
	.refine((value) => {
		const [whole = "0", fraction = ""] = value.replace(",", ".").split(".");
		return Number.isSafeInteger(Number(whole) * 100 + Number(fraction.padEnd(2, "0")));
	}, "El importe está fuera de rango.");

export const positiveMoneySchema = nonNegativeMoneySchema.refine(
	(value) => Number(value.replace(",", ".")) > 0,
	"El importe debe ser mayor que cero.",
);

export const cashMovementReasonSchema = z
	.string()
	.trim()
	.min(3, "Escribe un motivo de al menos 3 caracteres.")
	.max(160, "Usa como máximo 160 caracteres.");

export const openCashFormSchema = z.object({ openingCash: nonNegativeMoneySchema });
export const cashMovementFormSchema = z.object({
	amount: positiveMoneySchema,
	reason: cashMovementReasonSchema,
});
export const closeCashFormSchema = z.object({ countedCash: nonNegativeMoneySchema });
