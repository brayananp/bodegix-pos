import { z } from "zod";

export const positiveQuantitySchema = z
	.string()
	.trim()
	.regex(/^\d+$/, "Escribe una cantidad entera.")
	.refine((value) => Number(value) > 0, "La cantidad debe ser mayor que cero.");

export const nonNegativeQuantitySchema = z
	.string()
	.trim()
	.regex(/^\d+$/, "Escribe una cantidad entera no negativa.");

const optionalNoteSchema = z.string().trim().max(240, "Usa como máximo 240 caracteres.");
const requiredReasonSchema = z
	.string()
	.trim()
	.min(3, "Escribe un motivo de al menos 3 caracteres.")
	.max(240, "Usa como máximo 240 caracteres.");

export const initialStockFormSchema = z.object({
	quantity: positiveQuantitySchema,
	note: optionalNoteSchema,
});

export const stockEntryFormSchema = z.object({
	quantity: positiveQuantitySchema,
	reference: z.string().trim().max(80, "Usa como máximo 80 caracteres."),
	note: optionalNoteSchema,
});

export const stockReconciliationFormSchema = z.object({
	countedQuantity: nonNegativeQuantitySchema,
	reason: requiredReasonSchema,
});

export const stockLossFormSchema = z
	.object({
		quantity: positiveQuantitySchema,
		lossType: z.enum(["damaged", "expired", "other"]),
		reason: optionalNoteSchema,
	})
	.superRefine((value, context) => {
		if (value.lossType === "other" && value.reason.length < 3) {
			context.addIssue({
				code: "custom",
				path: ["reason"],
				message: "Explica la causa de esta pérdida.",
			});
		}
	});
