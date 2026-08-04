import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import { nowTimestamp } from "@/shared/kernel/dates";
import { createId } from "@/shared/kernel/ids";
import type { VoidSaleInput, VoidSaleResult, VoidSaleUnitOfWork } from "../application";
import { SaleError, checkSaleVoidEligibility } from "../domain";

interface Dependencies {
	createId(): string;
	now(): number;
}

const defaults: Dependencies = { createId, now: nowTimestamp };

/**
 * Implementación Dexie del Unit of Work para anulación de ventas.
 *
 * Ejecuta transacción ACID que:
 * - Marca venta como anulada
 * - Marca pagos como anulados
 * - Devuelve stock a productos
 * - Registra movimientos compensatorios de inventario
 */
export class DexieVoidSaleUnitOfWork implements VoidSaleUnitOfWork {
	constructor(
		private readonly database: BodegixDatabase,
		private readonly deps: Dependencies = defaults,
	) {}

	async execute(input: VoidSaleInput): Promise<VoidSaleResult> {
		const { saleId, reason } = input;
		const now = this.deps.now();

		try {
			return await this.database.transaction(
				"rw",
				[
					this.database.sales,
					this.database.saleItems,
					this.database.salePayments,
					this.database.products,
					this.database.inventoryMovements,
					this.database.cashSessions,
				],
				async () => {
					// 1. Cargar venta
					const sale = await this.database.sales.get(saleId);
					if (!sale) {
						throw new SaleError("SALE_NOT_FOUND");
					}

					// 2. Cargar sesión de caja actual
					const currentSession = await this.database.cashSessions
						.where("status")
						.equals("open")
						.first();

					// 3. Verificar elegibilidad
					const eligibility = checkSaleVoidEligibility({
						saleStatus: sale.status,
						saleCashSessionId: sale.cashSessionId,
						currentCashSessionId: currentSession?.id ?? null,
						isCurrentSessionOpen: currentSession?.status === "open",
					});

					if (!eligibility.canVoid) {
						switch (eligibility.reason) {
							case "ALREADY_VOIDED":
								throw new SaleError("SALE_ALREADY_VOIDED");
							case "SESSION_CLOSED":
								throw new SaleError("SALE_SESSION_CLOSED");
							case "SESSION_MISMATCH":
								throw new SaleError("SALE_SESSION_MISMATCH");
							default:
								throw new SaleError("VOID_PERSISTENCE_FAILED");
						}
					}

					// 4. Marcar venta como anulada
					await this.database.sales.update(saleId, {
						status: "voided",
						voidedAt: now,
						voidReason: reason.trim(),
					});

					// 5. Marcar todos los pagos como anulados
					const payments = await this.database.salePayments
						.where("saleId")
						.equals(saleId)
						.toArray();

					for (const payment of payments) {
						await this.database.salePayments.update(payment.id, {
							status: "voided",
							voidedAt: now,
						});
					}

					// 6. Cargar items de la venta
					const saleItems = await this.database.saleItems.where("saleId").equals(saleId).toArray();

					// 7. Devolver stock y registrar movimientos compensatorios
					let itemsRestored = 0;
					for (const item of saleItems) {
						const product = await this.database.products.get(item.productId);
						if (!product) {
							// Producto eliminado - continuamos sin devolver stock
							continue;
						}

						const stockBefore = product.stockQuantity;
						const stockAfter = stockBefore + item.quantity;

						// Actualizar stock del producto
						await this.database.products.update(item.productId, {
							stockQuantity: stockAfter,
							updatedAt: now,
						});

						// Registrar movimiento compensatorio de inventario
						await this.database.inventoryMovements.add({
							id: this.deps.createId(),
							productId: item.productId,
							type: "sale_void",
							quantityDelta: item.quantity,
							stockBefore,
							stockAfter,
							referenceType: "sale",
							referenceId: saleId,
							reason: `Anulación de venta #${sale.saleNumber}`,
							createdAt: now,
						});

						itemsRestored += item.quantity;
					}

					return {
						saleId,
						saleNumber: sale.saleNumber,
						voidedAt: now,
						cashSessionId: sale.cashSessionId,
						totalCents: sale.totalCents,
						itemsRestored,
					};
				},
			);
		} catch (error) {
			if (error instanceof SaleError) {
				throw error;
			}
			throw new SaleError("VOID_PERSISTENCE_FAILED", { cause: error });
		}
	}
}
