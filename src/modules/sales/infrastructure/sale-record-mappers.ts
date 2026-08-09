import type {
	SaleDraftRecord,
	SaleItemRecord,
	SalePaymentRecord,
	SaleRecord,
} from "@/shared/infrastructure/local-db";
import type { SaleResultItem, SaleResultPayment } from "../application";
import type { SaleDraft, SaleItem, SalePayment } from "../domain";

export function saleItemFromRecord(record: SaleItemRecord): SaleItem {
	return {
		id: record.id,
		saleId: record.saleId,
		productId: record.productId,
		productName: record.productName,
		unitPriceCents: record.unitPriceCents,
		unitCostCents: record.unitCostCents,
		quantity: record.quantity,
		subtotalCents: record.subtotalCents,
	};
}

export function salePaymentFromRecord(record: SalePaymentRecord): SalePayment {
	return {
		id: record.id,
		saleId: record.saleId,
		method: record.method,
		amountCents: record.amountCents,
		status: record.status,
		providerLabel: record.providerLabel,
		operationReference: record.operationReference,
		cashReceivedCents: record.cashReceivedCents,
		changeCents: record.changeCents,
		verifiedAt: record.verifiedAt,
		voidedAt: record.voidedAt,
		voidOperationReference: record.voidOperationReference,
		createdAt: record.createdAt,
	};
}

export function saleDraftFromRecord(record: SaleDraftRecord): SaleDraft {
	return {
		id: "main",
		items: record.items.map((item) => ({
			productId: item.productId,
			quantity: item.quantity,
			expectedUnitPriceCents: item.expectedUnitPriceCents,
		})),
		updatedAt: record.updatedAt,
	};
}

export function saleResultItemFromRecord(record: SaleItemRecord): SaleResultItem {
	return {
		id: record.id,
		productId: record.productId,
		productName: record.productName,
		unitPriceCents: record.unitPriceCents,
		quantity: record.quantity,
		subtotalCents: record.subtotalCents,
	};
}

export function saleResultPaymentFromRecord(record: SalePaymentRecord): SaleResultPayment {
	return {
		id: record.id,
		method: record.method,
		amountCents: record.amountCents,
		changeCents: record.changeCents,
		cashReceivedCents: record.cashReceivedCents,
		providerLabel: record.providerLabel,
		operationReference: record.operationReference,
	};
}

export function saleFromRecord(record: SaleRecord) {
	return {
		id: record.id,
		saleNumber: record.saleNumber,
		cashSessionId: record.cashSessionId,
		subtotalCents: record.subtotalCents,
		totalCents: record.totalCents,
		status: record.status,
		createdAt: record.createdAt,
		voidedAt: record.voidedAt,
		voidReason: record.voidReason,
	};
}
