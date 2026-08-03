import type Dexie from "dexie";

export const SCHEMA_V1 = {
	categories: "id, &normalizedName, isActive, updatedAt",
	products:
		"id, barcode, normalizedName, categoryId, isActive, [isActive+normalizedName], updatedAt",
	inventoryMovements:
		"id, productId, type, referenceType, referenceId, createdAt, [productId+createdAt], [referenceType+referenceId]",
	sales:
		"id, &saleNumber, cashSessionId, status, createdAt, [status+createdAt], [cashSessionId+createdAt]",
	saleItems: "id, saleId, productId, [saleId+productId]",
	salePayments: "id, saleId, method, status, createdAt, [saleId+status], [method+createdAt]",
	cashSessions: "id, status, openedAt, closedAt",
	cashMovements: "id, cashSessionId, type, createdAt, [cashSessionId+createdAt]",
	appSettings: "id",
} as const;

export function registerSchemaV1(database: Dexie): void {
	database.version(1).stores(SCHEMA_V1);
}
