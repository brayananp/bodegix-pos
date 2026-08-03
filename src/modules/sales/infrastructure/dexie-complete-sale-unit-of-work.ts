import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import { nowTimestamp } from "@/shared/kernel/dates";
import { createId } from "@/shared/kernel/ids";
import type {
	CompletedSaleResult,
	CompleteSaleInput,
	CompleteSaleUnitOfWork,
} from "../application";
import {
	getProviderLabel,
	isExternalPayment,
	SaleError,
	validateCashReceived,
	validateOperationReference,
	validatePaymentAmount,
	validatePaymentTotal,
	validateSaleNumber,
	validateUniquePaymentMethods,
} from "../domain";
import { SALE_DRAFT_MAX_LINES } from "../domain/sale-draft";
import { MAX_PAYMENT_METHODS } from "../domain/sale-rules";

interface Dependencies {
	createId(): string;
	now(): number;
}

const defaults: Dependencies = { createId, now: nowTimestamp };

export class DexieCompleteSaleUnitOfWork implements CompleteSaleUnitOfWork {
	constructor(
		private readonly database: BodegixDatabase,
		private readonly deps: Dependencies = defaults,
	) {}

	async execute(input: CompleteSaleInput): Promise<CompletedSaleResult> {
		const { paymentIntents } = input;

		// ── Validaciones pre-transacción ─────────────────────────────
		if (paymentIntents.length === 0) {
			throw new SaleError("INVALID_PAYMENT");
		}
		if (paymentIntents.length > MAX_PAYMENT_METHODS) {
			throw new SaleError("INVALID_PAYMENT");
		}
		validateUniquePaymentMethods(paymentIntents.map((p) => p.method));
		for (const intent of paymentIntents) {
			validatePaymentAmount(intent.amountCents);
			if (intent.method === "cash") {
				validateCashReceived(intent.amountCents, intent.cashReceivedCents ?? 0);
			} else if (!intent.manuallyVerified) {
				throw new SaleError("MANUAL_VERIFICATION_REQUIRED");
			}
		}

		try {
			return await this.database.transaction(
				"rw",
				[
					this.database.appSettings,
					this.database.cashSessions,
					this.database.products,
					this.database.sales,
					this.database.saleItems,
					this.database.salePayments,
					this.database.inventoryMovements,
					this.database.saleDrafts,
				],
				async () => {
					// 1. Cargar borrador
					const draft = await this.database.saleDrafts.get("main");
					if (!draft || draft.items.length === 0) {
						throw new SaleError("SALE_DRAFT_EMPTY");
					}
					if (draft.items.length > SALE_DRAFT_MAX_LINES) {
						throw new SaleError("SALE_DRAFT_TOO_LARGE");
					}

					// 2. Caja abierta
					const session = await this.database.cashSessions.where("status").equals("open").first();
					if (!session) throw new SaleError("CASH_SESSION_REQUIRED");

					// 3. Correlativo
					const settings = await this.database.appSettings.get("main");
					if (!settings) throw new SaleError("SALE_NUMBER_INVALID");
					const saleNumber = settings.nextSaleNumber;
					validateSaleNumber(saleNumber);

					// 4. Productos en lote
					const productIds = draft.items.map((i) => i.productId);
					const productRecords = await this.database.products.bulkGet(productIds);
					const productMap = new Map(
						productRecords
							.filter((p): p is NonNullable<typeof p> => p !== undefined)
							.map((p) => [p.id, p]),
					);

					// 5. Validar cada ítem
					let subtotalCents = 0;
					for (const item of draft.items) {
						const product = productMap.get(item.productId);
						if (!product) {
							throw new SaleError("PRODUCT_NOT_FOUND", { productId: item.productId });
						}
						if (!product.isActive) {
							throw new SaleError("PRODUCT_INACTIVE", { productId: item.productId });
						}
						if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
							throw new SaleError("INVALID_ITEM_QUANTITY", { productId: item.productId });
						}
						if (product.salePriceCents !== item.expectedUnitPriceCents) {
							throw new SaleError("PRODUCT_PRICE_CHANGED", { productId: item.productId });
						}
						if (item.quantity > product.stockQuantity) {
							throw new SaleError("INSUFFICIENT_STOCK", { productId: item.productId });
						}
						const lineTotal = item.expectedUnitPriceCents * item.quantity;
						if (!Number.isSafeInteger(lineTotal)) {
							throw new SaleError("SALE_PERSISTENCE_FAILED");
						}
						subtotalCents += lineTotal;
						if (!Number.isSafeInteger(subtotalCents)) {
							throw new SaleError("SALE_PERSISTENCE_FAILED");
						}
					}
					const totalCents = subtotalCents;

					// 6. Validar pagos contra total
					validatePaymentTotal(
						paymentIntents.map((p) => p.amountCents),
						totalCents,
					);

					// 7. Generar IDs y timestamp
					const now = this.deps.now();
					const saleId = this.deps.createId();

					// 8. Crear Sale
					await this.database.sales.add({
						id: saleId,
						saleNumber,
						cashSessionId: session.id,
						subtotalCents,
						totalCents,
						status: "completed",
						createdAt: now,
					});

					// 9. Crear SaleItems + descontar stock + crear movimientos
					const saleItemIds: string[] = [];
					let itemCount = 0;
					for (const item of draft.items) {
						const product = productMap.get(item.productId);
						if (!product) {
							throw new SaleError("PRODUCT_NOT_FOUND", { productId: item.productId });
						}
						const itemId = this.deps.createId();
						saleItemIds.push(itemId);
						itemCount += item.quantity;

						await this.database.saleItems.add({
							id: itemId,
							saleId,
							productId: item.productId,
							productName: product.name,
							unitPriceCents: product.salePriceCents,
							unitCostCents: product.costPriceCents,
							quantity: item.quantity,
							subtotalCents: item.expectedUnitPriceCents * item.quantity,
						});

						const stockBefore = product.stockQuantity;
						const stockAfter = stockBefore - item.quantity;
						if (stockAfter < 0) {
							throw new SaleError("INSUFFICIENT_STOCK", { productId: item.productId });
						}

						await this.database.products.update(item.productId, {
							stockQuantity: stockAfter,
							updatedAt: now,
						});

						await this.database.inventoryMovements.add({
							id: this.deps.createId(),
							productId: item.productId,
							type: "sale",
							quantityDelta: -item.quantity,
							stockBefore,
							stockAfter,
							referenceType: "sale",
							referenceId: saleId,
							reason: null,
							createdAt: now,
						});
					}

					// 10. Crear SalePayments
					const paymentResults: CompletedSaleResult["payments"] = [];
					for (const intent of paymentIntents) {
						const paymentId = this.deps.createId();
						const changeCents =
							intent.method === "cash"
								? (intent.cashReceivedCents ?? intent.amountCents) - intent.amountCents
								: null;
						const cleanRef = validateOperationReference(intent.operationReference);

						await this.database.salePayments.add({
							id: paymentId,
							saleId,
							method: intent.method,
							amountCents: intent.amountCents,
							status: isExternalPayment(intent.method) ? "manually_verified" : "confirmed",
							providerLabel: getProviderLabel(intent.method),
							operationReference: cleanRef,
							cashReceivedCents:
								intent.method === "cash" ? (intent.cashReceivedCents ?? intent.amountCents) : null,
							changeCents,
							verifiedAt: now,
							createdAt: now,
						});

						paymentResults.push({
							method: intent.method,
							amountCents: intent.amountCents,
							changeCents,
							providerLabel: getProviderLabel(intent.method),
						});
					}

					// 11. Incrementar correlativo
					await this.database.appSettings.update("main", {
						nextSaleNumber: saleNumber + 1,
						updatedAt: now,
					});

					// 12. Limpiar borrador
					await this.database.saleDrafts.delete("main");

					const totalChange = paymentResults.reduce((acc, p) => acc + (p.changeCents ?? 0), 0);

					return {
						saleId,
						saleNumber,
						subtotalCents,
						totalCents,
						itemCount,
						lineCount: draft.items.length,
						payments: paymentResults,
						changeCents: totalChange,
						cashSessionId: session.id,
						createdAt: now,
					};
				},
			);
		} catch (error) {
			if (error instanceof SaleError) throw error;
			throw new SaleError("SALE_PERSISTENCE_FAILED", { cause: error });
		}
	}
}
