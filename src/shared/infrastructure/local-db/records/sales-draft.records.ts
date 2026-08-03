import { z } from "zod";
import {
	persistedIdSchema,
	persistedPositiveIntegerSchema,
	persistedTimestampSchema,
} from "./persistence.schemas";

export const saleDraftItemRecordSchema = z.object({
	productId: persistedIdSchema,
	quantity: persistedPositiveIntegerSchema,
	expectedUnitPriceCents: persistedPositiveIntegerSchema,
});

export const saleDraftRecordSchema = z.object({
	id: z.literal("main"),
	items: z.array(saleDraftItemRecordSchema),
	updatedAt: persistedTimestampSchema,
});

export type SaleDraftItemRecord = z.infer<typeof saleDraftItemRecordSchema>;
export type SaleDraftRecord = z.infer<typeof saleDraftRecordSchema>;
