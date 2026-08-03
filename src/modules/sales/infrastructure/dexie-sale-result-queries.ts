import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import type { SaleResultQueries, SaleResultView } from "../application";
import { buildSaleResultView } from "../application";
import { saleResultItemFromRecord, saleResultPaymentFromRecord } from "./sale-record-mappers";

export class DexieSaleResultQueries implements SaleResultQueries {
	constructor(private readonly database: BodegixDatabase) {}

	async getSaleResult(saleId: string): Promise<SaleResultView | null> {
		const sale = await this.database.sales.get(saleId);
		if (!sale) return null;

		const [itemRecords, paymentRecords] = await Promise.all([
			this.database.saleItems.where("saleId").equals(saleId).toArray(),
			this.database.salePayments.where("saleId").equals(saleId).toArray(),
		]);

		return buildSaleResultView({
			saleId: sale.id,
			saleNumber: sale.saleNumber,
			subtotalCents: sale.subtotalCents,
			totalCents: sale.totalCents,
			createdAt: sale.createdAt,
			items: itemRecords.map(saleResultItemFromRecord),
			payments: paymentRecords.map(saleResultPaymentFromRecord),
		});
	}
}
