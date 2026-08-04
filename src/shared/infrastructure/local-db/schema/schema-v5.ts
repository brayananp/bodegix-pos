import type Dexie from "dexie";
import type { SalePaymentRecord } from "../records";
import { SCHEMA_V4 } from "./schema-v4";

/**
 * V5: Agrega campos de anulación a pagos.
 * - voidedAt: timestamp de cuándo se anuló el pago
 * - voidOperationReference: referencia de la operación de devolución
 *
 * Conserva todos los índices existentes.
 */
export const SCHEMA_V5 = {
	...SCHEMA_V4,
} as const;

export function registerSchemaV5(database: Dexie): void {
	database
		.version(5)
		.stores(SCHEMA_V5)
		.upgrade((transaction) =>
			transaction
				.table<SalePaymentRecord, string>("salePayments")
				.toCollection()
				.modify((payment) => {
					payment.voidedAt ??= null;
					payment.voidOperationReference ??= null;
				}),
		);
}
