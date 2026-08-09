import Dexie, { type EntityTable } from "dexie";
import type {
	AppSettingsRecord,
	CashMovementRecord,
	CashSessionRecord,
	CategoryRecord,
	InventoryMovementRecord,
	ProductRecord,
	SaleDraftRecord,
	SaleItemRecord,
	SalePaymentRecord,
	SaleRecord,
} from "./records";
import {
	DATABASE_NAME,
	registerSchemaV1,
	registerSchemaV2,
	registerSchemaV3,
	registerSchemaV4,
	registerSchemaV5,
	registerSchemaV6,
	registerSchemaV7,
} from "./schema";

export class BodegixDatabase extends Dexie {
	categories!: EntityTable<CategoryRecord, "id">;
	products!: EntityTable<ProductRecord, "id">;
	inventoryMovements!: EntityTable<InventoryMovementRecord, "id">;
	sales!: EntityTable<SaleRecord, "id">;
	saleItems!: EntityTable<SaleItemRecord, "id">;
	salePayments!: EntityTable<SalePaymentRecord, "id">;
	cashSessions!: EntityTable<CashSessionRecord, "id">;
	cashMovements!: EntityTable<CashMovementRecord, "id">;
	appSettings!: EntityTable<AppSettingsRecord, "id">;
	saleDrafts!: EntityTable<SaleDraftRecord, "id">;

	constructor(databaseName = DATABASE_NAME) {
		super(databaseName);
		registerSchemaV1(this);
		registerSchemaV2(this);
		registerSchemaV3(this);
		registerSchemaV4(this);
		registerSchemaV5(this);
		registerSchemaV6(this);
		registerSchemaV7(this);
	}
}
