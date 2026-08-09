import { z } from "zod";
import {
	REVERSAL_REFERENCE_MAX_LENGTH,
	VOID_REASON_MAX_LENGTH,
	VOID_REASON_MIN_LENGTH,
} from "../../../domain";

const referenceSchema = z
	.string()
	.trim()
	.max(REVERSAL_REFERENCE_MAX_LENGTH, "La referencia admite hasta 80 caracteres.")
	.regex(/^[\p{L}\p{N}\s._#/-]*$/u, "La referencia contiene caracteres no permitidos.");

export const voidSaleFormSchema = z
	.object({
		reasonPreset: z.string(),
		reasonDetails: z.string().trim().max(VOID_REASON_MAX_LENGTH),
		paymentReversals: z.array(
			z.object({
				paymentId: z.string().min(1),
				method: z.enum(["cash", "yape", "plin", "card", "bank_transfer"]),
				amountCents: z.number().int().positive(),
				confirmed: z.literal(true, { error: "Confirma la devolución de este pago." }),
				reversalReference: referenceSchema,
			}),
		),
	})
	.superRefine((values, context) => {
		const reason =
			values.reasonPreset === "Otro" ? values.reasonDetails.trim() : values.reasonPreset;
		if (reason.length < VOID_REASON_MIN_LENGTH || reason.length > VOID_REASON_MAX_LENGTH) {
			context.addIssue({
				code: "custom",
				path: ["reasonDetails"],
				message: "Describe un motivo entre 5 y 240 caracteres.",
			});
		}
		if (
			new Set(values.paymentReversals.map(({ paymentId }) => paymentId)).size !==
			values.paymentReversals.length
		) {
			context.addIssue({
				code: "custom",
				path: ["paymentReversals"],
				message: "Hay pagos duplicados.",
			});
		}
	});
