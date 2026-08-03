import { z } from "zod";

export const persistedIdSchema = z.string().trim().min(1);
export const persistedTimestampSchema = z.number().int().positive();
export const persistedIntegerSchema = z.number().int();
export const persistedNonNegativeIntegerSchema = persistedIntegerSchema.nonnegative();
export const persistedPositiveIntegerSchema = persistedIntegerSchema.positive();

export const inventoryMovementTypeSchema = z.enum([
	"initial_stock",
	"purchase",
	"sale",
	"sale_void",
	"adjustment_in",
	"adjustment_out",
	"damaged",
	"expired",
]);

export const inventoryReferenceTypeSchema = z.enum(["sale", "manual", "setup"]);
export const saleStatusSchema = z.enum(["completed", "voided"]);
export const paymentMethodSchema = z.enum(["cash", "yape", "plin", "card", "bank_transfer"]);
export const paymentStatusSchema = z.enum(["confirmed", "manually_verified", "voided"]);
export const cashSessionStatusSchema = z.enum(["open", "closed"]);
export const cashMovementTypeSchema = z.enum(["deposit", "withdrawal"]);

export type InventoryMovementType = z.infer<typeof inventoryMovementTypeSchema>;
export type InventoryReferenceType = z.infer<typeof inventoryReferenceTypeSchema>;
export type SaleStatus = z.infer<typeof saleStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type CashSessionStatus = z.infer<typeof cashSessionStatusSchema>;
export type CashMovementType = z.infer<typeof cashMovementTypeSchema>;
