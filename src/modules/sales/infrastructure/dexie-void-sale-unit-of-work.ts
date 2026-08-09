import type { BodegixDatabase, ProductRecord } from "@/shared/infrastructure/local-db";
import { nowTimestamp } from "@/shared/kernel/dates";
import { createId } from "@/shared/kernel/ids";
import type { VoidSaleInput, VoidSaleResult, VoidSaleUnitOfWork } from "../application";
import {
	SaleError,
	checkSaleVoidEligibility,
	normalizeVoidReason,
	validatePaymentReversals,
} from "../domain";

interface Dependencies {
	createId(): string;
	now(): number;
}

const defaults: Dependencies = { createId, now: nowTimestamp };

export class DexieVoidSaleUnitOfWork implements VoidSaleUnitOfWork {
	constructor(
		private readonly database: BodegixDatabase,
		private readonly deps: Dependencies = defaults,
	) {}

	async execute(input: VoidSaleInput): Promise<VoidSaleResult> {
		const reason = normalizeVoidReason(input.reason);
		try {
			return await this.database.transaction(
				"rw",
				[
					this.database.sales,
					this.database.saleItems,
					this.database.salePayments,
					this.database.cashSessions,
					this.database.products,
					this.database.inventoryMovements,
				],
				async () => {
					const sale = await this.database.sales.get(input.saleId);
					if (!sale) throw new SaleError("SALE_NOT_FOUND");
					if (sale.status === "voided") throw new SaleError("SALE_ALREADY_VOIDED");

					const [session, openSessions, items, payments] = await Promise.all([
						this.database.cashSessions.get(sale.cashSessionId),
						this.database.cashSessions.where("status").equals("open").toArray(),
						this.database.saleItems.where("saleId").equals(sale.id).toArray(),
						this.database.salePayments.where("saleId").equals(sale.id).toArray(),
					]);

					const eligibility = checkSaleVoidEligibility({
						saleStatus: sale.status,
						saleVoidedAt: sale.voidedAt,
						saleVoidReason: sale.voidReason,
						saleCashSessionId: sale.cashSessionId,
						originalSessionExists: session !== undefined,
						originalSessionStatus: session?.status ?? null,
						openSessionIds: openSessions.map(({ id }) => id),
						hasItems: items.length > 0,
						hasPayments: payments.length > 0,
					});

					if (items.length === 0) throw new SaleError("SALE_ITEM_MISSING");
					if (payments.length === 0) throw new SaleError("SALE_PAYMENT_MISSING");
					if (!eligibility.eligible) this.throwEligibilityError(eligibility.reason);

					const reversalReferences = validatePaymentReversals(
						input.paymentReversals,
						payments.map(({ id }) => id),
					);
					const quantitiesByProduct = new Map<string, number>();
					for (const item of items) {
						quantitiesByProduct.set(
							item.productId,
							(quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
						);
					}

					const productIds = [...quantitiesByProduct.keys()];
					const productRecords = await this.database.products.bulkGet(productIds);
					const products = new Map<string, ProductRecord>();
					for (let index = 0; index < productIds.length; index += 1) {
						const productId = productIds[index];
						const product = productRecords[index];
						if (!productId) throw new SaleError("SALE_PRODUCT_MISSING");
						if (!product) throw new SaleError("SALE_PRODUCT_MISSING", { productId });
						products.set(productId, product);
					}

					const voidedAt = Math.max(this.deps.now(), sale.createdAt + 1, session?.openedAt ?? 0);
					for (const [productId, quantity] of quantitiesByProduct) {
						const product = products.get(productId);
						if (!product) throw new SaleError("SALE_PRODUCT_MISSING", { productId });
						const stockAfter = product.stockQuantity + quantity;
						if (!Number.isSafeInteger(stockAfter))
							throw new SaleError("SALE_VOID_PERSISTENCE_FAILED");

						await this.database.products.update(productId, {
							stockQuantity: stockAfter,
							updatedAt: voidedAt,
						});
						await this.database.inventoryMovements.add({
							id: this.deps.createId(),
							productId,
							type: "sale_void",
							quantityDelta: quantity,
							stockBefore: product.stockQuantity,
							stockAfter,
							referenceType: "sale",
							referenceId: sale.id,
							reason,
							createdAt: voidedAt,
						});
					}

					for (const payment of payments) {
						await this.database.salePayments.update(payment.id, {
							status: "voided",
							voidedAt,
							voidOperationReference:
								payment.method === "cash" ? null : (reversalReferences.get(payment.id) ?? null),
						});
					}
					await this.database.sales.update(sale.id, {
						status: "voided",
						voidedAt,
						voidReason: reason,
					});

					return {
						saleId: sale.id,
						saleNumber: sale.saleNumber,
						totalCents: sale.totalCents,
						restoredItemCount: items.length,
						restoredUnitCount: items.reduce((sum, item) => sum + item.quantity, 0),
						paymentReversals: payments.map((payment) => ({
							method: payment.method,
							amountCents: payment.amountCents,
							reversalReference:
								payment.method === "cash" ? null : (reversalReferences.get(payment.id) ?? null),
						})),
						cashSessionId: sale.cashSessionId,
						voidedAt,
						reason,
					};
				},
			);
		} catch (error) {
			if (error instanceof SaleError) throw error;
			throw new SaleError("SALE_VOID_PERSISTENCE_FAILED", { cause: error });
		}
	}

	private throwEligibilityError(reason: string | null): never {
		if (reason === "SALE_ALREADY_VOIDED") throw new SaleError("SALE_ALREADY_VOIDED");
		if (reason === "CASH_SESSION_NOT_FOUND") throw new SaleError("SALE_CASH_SESSION_NOT_FOUND");
		if (reason === "CASH_SESSION_CLOSED") throw new SaleError("SALE_CASH_SESSION_CLOSED");
		if (reason === "DIFFERENT_OPEN_SESSION") throw new SaleError("SALE_CASH_SESSION_CHANGED");
		if (reason === "SALE_DATA_INCONSISTENT") throw new SaleError("SALE_VOID_NOT_ALLOWED");
		throw new SaleError("SALE_VOID_NOT_ALLOWED");
	}
}
