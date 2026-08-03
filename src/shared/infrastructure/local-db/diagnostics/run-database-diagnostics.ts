import type { BodegixDatabase } from "../bodegix-database";
import { LocalDatabaseError } from "../database-errors";
import { appSettingsRecordSchema } from "../records";
import { DATABASE_SCHEMA_VERSION, SCHEMA_V1 } from "../schema";
import type {
	DatabaseDiagnosticCheck,
	DatabaseDiagnosticReport,
	DiagnosticMode,
	DiagnosticStatus,
} from "./database-diagnostic.types";

function aggregateStatus(checks: DatabaseDiagnosticCheck[]): DiagnosticStatus {
	if (checks.some(({ status }) => status === "fail")) return "fail";
	if (checks.some(({ status }) => status === "warning")) return "warning";
	return "pass";
}

function relationCheck(id: string, label: string, orphanCount: number): DatabaseDiagnosticCheck {
	return orphanCount === 0
		? { id, status: "pass", message: `No hay ${label}.` }
		: {
				id,
				status: "warning",
				message: `Se encontraron ${label}.`,
				details: { orphanCount },
			};
}

async function runDeepChecks(database: BodegixDatabase): Promise<DatabaseDiagnosticCheck[]> {
	const [productIds, saleIds, cashSessionIds] = await Promise.all([
		database.products.toCollection().primaryKeys(),
		database.sales.toCollection().primaryKeys(),
		database.cashSessions.toCollection().primaryKeys(),
	]);
	const products = new Set(productIds);
	const sales = new Set(saleIds);
	const cashSessions = new Set(cashSessionIds);

	let orphanSaleItems = 0;
	let orphanSalePayments = 0;
	let orphanInventoryMovements = 0;
	let orphanSales = 0;
	let orphanCashMovements = 0;

	await Promise.all([
		database.saleItems.each(({ saleId }) => {
			if (!sales.has(saleId)) orphanSaleItems += 1;
		}),
		database.salePayments.each(({ saleId }) => {
			if (!sales.has(saleId)) orphanSalePayments += 1;
		}),
		database.inventoryMovements.each(({ productId }) => {
			if (!products.has(productId)) orphanInventoryMovements += 1;
		}),
		database.sales.each(({ cashSessionId }) => {
			if (!cashSessions.has(cashSessionId)) orphanSales += 1;
		}),
		database.cashMovements.each(({ cashSessionId }) => {
			if (!cashSessions.has(cashSessionId)) orphanCashMovements += 1;
		}),
	]);

	return [
		relationCheck("sale-items-references", "ítems de venta huérfanos", orphanSaleItems),
		relationCheck("sale-payments-references", "pagos de venta huérfanos", orphanSalePayments),
		relationCheck(
			"inventory-movements-references",
			"movimientos de inventario sin producto",
			orphanInventoryMovements,
		),
		relationCheck("sales-references", "ventas sin sesión de caja", orphanSales),
		relationCheck(
			"cash-movements-references",
			"movimientos de caja sin sesión",
			orphanCashMovements,
		),
	];
}

export async function runDatabaseDiagnostics(
	database: BodegixDatabase,
	mode: DiagnosticMode = "basic",
): Promise<DatabaseDiagnosticReport> {
	const checks: DatabaseDiagnosticCheck[] = [];

	try {
		if (!database.isOpen()) await database.open();
		checks.push({ id: "database-open", status: "pass", message: "La base puede abrirse." });

		checks.push(
			database.verno === DATABASE_SCHEMA_VERSION
				? { id: "schema-version", status: "pass", message: "La versión del esquema coincide." }
				: {
						id: "schema-version",
						status: "fail",
						message: "La versión del esquema no coincide.",
						details: { expected: DATABASE_SCHEMA_VERSION, actual: database.verno },
					},
		);

		const expectedTables = Object.keys(SCHEMA_V1).sort();
		const actualTables = database.tables.map(({ name }) => name).sort();
		const missingTables = expectedTables.filter((name) => !actualTables.includes(name));
		checks.push(
			missingTables.length === 0
				? { id: "tables", status: "pass", message: "Existen todas las tablas esperadas." }
				: {
						id: "tables",
						status: "fail",
						message: "Faltan tablas del esquema.",
						details: { missingTables },
					},
		);

		const settings = await database.appSettings.get("main");
		checks.push(
			settings
				? { id: "app-settings-exists", status: "pass", message: "Existe appSettings/main." }
				: {
						id: "app-settings-exists",
						status: "fail",
						message: "No existe appSettings/main.",
					},
		);

		const parsedSettings = appSettingsRecordSchema.safeParse(settings);
		checks.push(
			parsedSettings.success
				? { id: "app-settings-valid", status: "pass", message: "La configuración es válida." }
				: {
						id: "app-settings-valid",
						status: "fail",
						message: "La configuración no es válida.",
						details: { issueCount: parsedSettings.error.issues.length },
					},
		);

		checks.push(
			settings && Number.isInteger(settings.nextSaleNumber) && settings.nextSaleNumber > 0
				? {
						id: "next-sale-number",
						status: "pass",
						message: "El correlativo de ventas es válido.",
					}
				: {
						id: "next-sale-number",
						status: "fail",
						message: "El correlativo de ventas no es un entero positivo.",
					},
		);

		const openCashSessions = await database.cashSessions.where("status").equals("open").count();
		checks.push(
			openCashSessions <= 1
				? {
						id: "single-open-cash-session",
						status: "pass",
						message: "Existe como máximo una sesión de caja abierta.",
					}
				: {
						id: "single-open-cash-session",
						status: "warning",
						message: "Existe más de una sesión de caja abierta.",
						details: { openCashSessions },
					},
		);

		if (mode === "deep") checks.push(...(await runDeepChecks(database)));

		return { status: aggregateStatus(checks), mode, checkedAt: Date.now(), checks };
	} catch (error) {
		throw new LocalDatabaseError("DATABASE_DIAGNOSTIC_FAILED", error);
	}
}
