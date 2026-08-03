import { z } from "zod";
import {
	cashMovementTypeSchema,
	cashSessionStatusSchema,
	persistedIdSchema,
	persistedNonNegativeIntegerSchema,
	persistedTimestampSchema,
} from "./persistence.schemas";

export const cashSessionRecordSchema = z.object({
	id: persistedIdSchema,
	status: cashSessionStatusSchema,
	openingCashCents: persistedNonNegativeIntegerSchema,
	completedSalesCount: persistedNonNegativeIntegerSchema.nullable(),
	totalSalesCents: persistedNonNegativeIntegerSchema.nullable(),
	cashSalesCents: persistedNonNegativeIntegerSchema.nullable(),
	yapeSalesCents: persistedNonNegativeIntegerSchema.nullable(),
	plinSalesCents: persistedNonNegativeIntegerSchema.nullable(),
	cardSalesCents: persistedNonNegativeIntegerSchema.nullable(),
	bankTransferSalesCents: persistedNonNegativeIntegerSchema.nullable(),
	manualDepositsCents: persistedNonNegativeIntegerSchema.nullable(),
	manualWithdrawalsCents: persistedNonNegativeIntegerSchema.nullable(),
	expectedCashCents: persistedNonNegativeIntegerSchema.nullable(),
	countedCashCents: persistedNonNegativeIntegerSchema.nullable(),
	differenceCents: z.number().int().nullable(),
	openedAt: persistedTimestampSchema,
	closedAt: persistedTimestampSchema.nullable(),
});

export const cashMovementRecordSchema = z.object({
	id: persistedIdSchema,
	cashSessionId: persistedIdSchema,
	type: cashMovementTypeSchema,
	amountCents: persistedNonNegativeIntegerSchema,
	reason: z.string().trim().min(3).max(160),
	createdAt: persistedTimestampSchema,
});

export type CashSessionRecord = z.infer<typeof cashSessionRecordSchema>;
export type CashMovementRecord = z.infer<typeof cashMovementRecordSchema>;
