import { z } from "zod";
import {
	persistedIdSchema,
	persistedIntegerSchema,
	persistedNonNegativeIntegerSchema,
	persistedTimestampSchema,
} from "./persistence.schemas";

export const categoryRecordSchema = z
	.object({
		id: persistedIdSchema,
		name: z.string().trim().min(1),
		normalizedName: z.string().trim().min(1),
		isActive: z.boolean(),
		createdAt: persistedTimestampSchema,
		updatedAt: persistedTimestampSchema,
	})
	.refine(({ createdAt, updatedAt }) => updatedAt >= createdAt, {
		message: "updatedAt debe ser posterior o igual a createdAt",
		path: ["updatedAt"],
	});

export const productRecordSchema = z
	.object({
		id: persistedIdSchema,
		barcode: z.string().trim().min(1).nullable(),
		name: z.string().trim().min(1),
		normalizedName: z.string().trim().min(1),
		categoryId: persistedIdSchema.nullable(),
		salePriceCents: persistedNonNegativeIntegerSchema,
		costPriceCents: persistedNonNegativeIntegerSchema.nullable(),
		stockQuantity: persistedIntegerSchema,
		minimumStockQuantity: persistedNonNegativeIntegerSchema,
		isActive: z.boolean(),
		createdAt: persistedTimestampSchema,
		updatedAt: persistedTimestampSchema,
	})
	.refine(({ createdAt, updatedAt }) => updatedAt >= createdAt, {
		message: "updatedAt debe ser posterior o igual a createdAt",
		path: ["updatedAt"],
	});

export type CategoryRecord = z.infer<typeof categoryRecordSchema>;
export type ProductRecord = z.infer<typeof productRecordSchema>;
