import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import { runWithDatabaseWriteAccess } from "@/shared/infrastructure/database-maintenance";
import { nowTimestamp } from "@/shared/kernel/dates";
import type { SaleDraftStore } from "../application";
import {
	SALE_DRAFT_MAX_LINES,
	SALE_DRAFT_MAX_QUANTITY_PER_LINE,
	type SaleDraft,
	SaleError,
} from "../domain";
import { saleDraftFromRecord } from "./sale-record-mappers";

export class DexieSaleDraftStore implements SaleDraftStore {
	constructor(
		private readonly database: BodegixDatabase,
		private readonly now = nowTimestamp,
	) {}

	async get(): Promise<SaleDraft | null> {
		const record = await this.database.saleDrafts.get("main");
		return record ? saleDraftFromRecord(record) : null;
	}

	async addProduct(productId: string, priceCents: number, stock: number): Promise<SaleDraft> {
		return runWithDatabaseWriteAccess(() =>
			this.database.transaction("rw", this.database.saleDrafts, async () => {
				const existing = await this.database.saleDrafts.get("main");
				const items = existing ? [...existing.items] : [];

				const idx = items.findIndex((i) => i.productId === productId);

				if (idx >= 0) {
					const current = items[idx];
					if (!current) throw new SaleError("SALE_DRAFT_NOT_FOUND");
					const newQty = current.quantity + 1;
					if (newQty > Math.min(stock, SALE_DRAFT_MAX_QUANTITY_PER_LINE)) {
						throw new SaleError("INSUFFICIENT_STOCK", { productId });
					}
					items[idx] = {
						...current,
						quantity: newQty,
						expectedUnitPriceCents: priceCents,
					};
				} else {
					if (items.length >= SALE_DRAFT_MAX_LINES) {
						throw new SaleError("SALE_DRAFT_TOO_LARGE");
					}
					if (stock <= 0) {
						throw new SaleError("INSUFFICIENT_STOCK", { productId });
					}
					items.push({
						productId,
						quantity: 1,
						expectedUnitPriceCents: priceCents,
					});
				}

				const record = { id: "main" as const, items, updatedAt: this.now() };
				await this.database.saleDrafts.put(record);
				return saleDraftFromRecord(record);
			}),
		);
	}

	async setQuantity(productId: string, quantity: number, stock: number): Promise<SaleDraft> {
		return runWithDatabaseWriteAccess(() =>
			this.database.transaction("rw", this.database.saleDrafts, async () => {
				const existing = await this.database.saleDrafts.get("main");
				const items = existing ? [...existing.items] : [];

				if (quantity <= 0) {
					const filtered = items.filter((i) => i.productId !== productId);
					const record = { id: "main" as const, items: filtered, updatedAt: this.now() };
					await this.database.saleDrafts.put(record);
					return saleDraftFromRecord(record);
				}

				if (!Number.isInteger(quantity) || quantity > SALE_DRAFT_MAX_QUANTITY_PER_LINE) {
					throw new SaleError("INVALID_ITEM_QUANTITY", { productId });
				}
				if (quantity > stock) {
					throw new SaleError("INSUFFICIENT_STOCK", { productId });
				}

				const idx = items.findIndex((i) => i.productId === productId);
				if (idx >= 0) {
					const current = items[idx];
					if (!current) throw new SaleError("SALE_DRAFT_NOT_FOUND");
					items[idx] = { ...current, quantity };
				} else {
					if (items.length >= SALE_DRAFT_MAX_LINES) {
						throw new SaleError("SALE_DRAFT_TOO_LARGE");
					}
					items.push({ productId, quantity, expectedUnitPriceCents: 0 });
				}

				const record = { id: "main" as const, items, updatedAt: this.now() };
				await this.database.saleDrafts.put(record);
				return saleDraftFromRecord(record);
			}),
		);
	}

	async removeProduct(productId: string): Promise<SaleDraft> {
		return runWithDatabaseWriteAccess(() =>
			this.database.transaction("rw", this.database.saleDrafts, async () => {
				const existing = await this.database.saleDrafts.get("main");
				const items = existing ? existing.items.filter((i) => i.productId !== productId) : [];
				const record = { id: "main" as const, items, updatedAt: this.now() };
				await this.database.saleDrafts.put(record);
				return saleDraftFromRecord(record);
			}),
		);
	}

	async clear(): Promise<void> {
		await runWithDatabaseWriteAccess(() => this.database.saleDrafts.delete("main"));
	}

	async refreshPrices(prices: Record<string, number>): Promise<SaleDraft> {
		return runWithDatabaseWriteAccess(() =>
			this.database.transaction("rw", this.database.saleDrafts, async () => {
				const existing = await this.database.saleDrafts.get("main");
				const items = existing
					? existing.items.map((item) => {
							const newPrice = prices[item.productId];
							return newPrice !== undefined ? { ...item, expectedUnitPriceCents: newPrice } : item;
						})
					: [];
				const record = { id: "main" as const, items, updatedAt: this.now() };
				await this.database.saleDrafts.put(record);
				return saleDraftFromRecord(record);
			}),
		);
	}
}
