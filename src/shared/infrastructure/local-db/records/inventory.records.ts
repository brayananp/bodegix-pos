import { z } from "zod";
import {
	inventoryMovementTypeSchema,
	inventoryReferenceTypeSchema,
	persistedIdSchema,
	persistedIntegerSchema,
	persistedTimestampSchema,
} from "./persistence.schemas";

export const inventoryMovementRecordSchema = z.object({
	id: persistedIdSchema,
	productId: persistedIdSchema,
	type: inventoryMovementTypeSchema,
	quantityDelta: persistedIntegerSchema,
	stockBefore: persistedIntegerSchema,
	stockAfter: persistedIntegerSchema,
	referenceType: inventoryReferenceTypeSchema,
	referenceId: persistedIdSchema.nullable(),
	reason: z.string().trim().min(1).nullable(),
	createdAt: persistedTimestampSchema,
});

export type InventoryMovementRecord = z.infer<typeof inventoryMovementRecordSchema>;
