import { z } from "zod";
import {
	paymentMethodSchema,
	paymentStatusSchema,
	persistedIdSchema,
	persistedNonNegativeIntegerSchema,
	persistedPositiveIntegerSchema,
	persistedTimestampSchema,
	saleStatusSchema,
} from "./persistence.schemas";

export const saleRecordSchema = z.object({
	id: persistedIdSchema,
	saleNumber: persistedPositiveIntegerSchema,
	cashSessionId: persistedIdSchema,
	subtotalCents: persistedNonNegativeIntegerSchema,
	totalCents: persistedNonNegativeIntegerSchema,
	status: saleStatusSchema,
	createdAt: persistedTimestampSchema,
	voidedAt: persistedTimestampSchema.nullable(),
	voidReason: z.string().trim().min(1).nullable(),
});

export const saleItemRecordSchema = z.object({
	id: persistedIdSchema,
	saleId: persistedIdSchema,
	productId: persistedIdSchema,
	productName: z.string().trim().min(1),
	unitPriceCents: persistedNonNegativeIntegerSchema,
	unitCostCents: persistedNonNegativeIntegerSchema.nullable(),
	quantity: persistedPositiveIntegerSchema,
	subtotalCents: persistedNonNegativeIntegerSchema,
});

export const salePaymentRecordSchema = z.object({
	id: persistedIdSchema,
	saleId: persistedIdSchema,
	method: paymentMethodSchema,
	amountCents: persistedNonNegativeIntegerSchema,
	status: paymentStatusSchema,
	providerLabel: z.string().trim().min(1).nullable(),
	operationReference: z.string().trim().min(1).nullable(),
	cashReceivedCents: persistedNonNegativeIntegerSchema.nullable(),
	changeCents: persistedNonNegativeIntegerSchema.nullable(),
	verifiedAt: persistedTimestampSchema,
	createdAt: persistedTimestampSchema,
});

export type SaleRecord = z.infer<typeof saleRecordSchema>;
export type SaleItemRecord = z.infer<typeof saleItemRecordSchema>;
export type SalePaymentRecord = z.infer<typeof salePaymentRecordSchema>;
