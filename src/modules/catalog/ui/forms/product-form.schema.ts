import { z } from "zod";

const moneySchema = z
	.string()
	.trim()
	.regex(/^\d+(?:[.,]\d{1,2})?$/, "Usa un importe con máximo dos decimales.");

export const productFormSchema = z.object({
	name: z.string().trim().min(2, "Escribe al menos 2 caracteres.").max(120),
	barcode: z
		.string()
		.trim()
		.max(64, "El código admite hasta 64 caracteres.")
		.refine(
			(value) => value === "" || /^[\p{L}\p{N}._\-/]+$/u.test(value),
			"Usa letras, números, punto, guion, barra o guion bajo.",
		),
	categoryId: z.string(),
	salePrice: moneySchema.refine((value) => !/^0+(?:[.,]0{1,2})?$/.test(value), {
		message: "El precio debe ser mayor que cero.",
	}),
	costPrice: z.union([z.literal(""), moneySchema]),
	minimumStockQuantity: z.string().regex(/^\d+$/, "Escribe una cantidad entera no negativa."),
});
