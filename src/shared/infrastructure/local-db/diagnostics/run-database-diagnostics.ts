import type { BodegixDatabase } from "../bodegix-database";
import { LocalDatabaseError } from "../database-errors";
import { appSettingsRecordSchema } from "../records";
import { DATABASE_SCHEMA_VERSION, SCHEMA_V2 } from "../schema";
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

interface InventoryIntegrityIssue {
	severity: "error" | "warning";
	productId: string;
	movementId: string | null;
	inconsistency: string;
}

async function inventoryLedgerCheck(database: BodegixDatabase): Promise<DatabaseDiagnosticCheck> {
	const [products, movements] = await Promise.all([
		database.products.toArray(),
		database.inventoryMovements.toArray(),
	]);
	const productsById = new Map(products.map((product) => [product.id, product]));
	const movementsByProduct = new Map<string, typeof movements>();
	const issues: InventoryIntegrityIssue[] = [];

	for (const movement of movements) {
		if (!productsById.has(movement.productId)) {
			issues.push({
				severity: "error",
				productId: movement.productId,
				movementId: movement.id,
				inconsistency: "El movimiento referencia un producto inexistente.",
			});
		}
		const productMovements = movementsByProduct.get(movement.productId) ?? [];
		productMovements.push(movement);
		movementsByProduct.set(movement.productId, productMovements);

		if (!Number.isSafeInteger(movement.quantityDelta) || movement.quantityDelta === 0) {
			issues.push({
				severity: "error",
				productId: movement.productId,
				movementId: movement.id,
				inconsistency: "El delta debe ser un entero distinto de cero.",
			});
		}
		if (
			!Number.isSafeInteger(movement.stockBefore) ||
			movement.stockBefore < 0 ||
			!Number.isSafeInteger(movement.stockAfter) ||
			movement.stockAfter < 0
		) {
			issues.push({
				severity: "error",
				productId: movement.productId,
				movementId: movement.id,
				inconsistency: "Los saldos deben ser enteros no negativos.",
			});
		}
		if (movement.stockAfter !== movement.stockBefore + movement.quantityDelta) {
			issues.push({
				severity: "error",
				productId: movement.productId,
				movementId: movement.id,
				inconsistency: "El saldo posterior no coincide con saldo anterior más delta.",
			});
		}
		if (movement.type === "initial_stock" && movement.stockBefore !== 0) {
			issues.push({
				severity: "error",
				productId: movement.productId,
				movementId: movement.id,
				inconsistency: "El stock inicial debe comenzar desde cero.",
			});
		}
		const mustBePositive = ["initial_stock", "purchase", "adjustment_in", "sale_void"].includes(
			movement.type,
		);
		const mustBeNegative = ["adjustment_out", "damaged", "expired", "sale"].includes(movement.type);
		if (
			(mustBePositive && movement.quantityDelta <= 0) ||
			(mustBeNegative && movement.quantityDelta >= 0)
		) {
			issues.push({
				severity: "error",
				productId: movement.productId,
				movementId: movement.id,
				inconsistency: "El signo del delta no corresponde al tipo de movimiento.",
			});
		}
	}

	for (const product of products) {
		const productMovements = movementsByProduct.get(product.id) ?? [];
		if (productMovements.length === 0 && product.stockQuantity !== 0) {
			issues.push({
				severity: "error",
				productId: product.id,
				movementId: null,
				inconsistency: "Un producto sin movimientos debe conservar stock cero.",
			});
			continue;
		}
		const initialMovements = productMovements.filter(({ type }) => type === "initial_stock");
		if (initialMovements.length > 1) {
			issues.push({
				severity: "error",
				productId: product.id,
				movementId: initialMovements.at(-1)?.id ?? null,
				inconsistency: "Existe más de un movimiento de stock inicial.",
			});
		}
		const lastMovement = productMovements
			.sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id))
			.at(-1);
		if (lastMovement && lastMovement.stockAfter !== product.stockQuantity) {
			issues.push({
				severity: "error",
				productId: product.id,
				movementId: lastMovement.id,
				inconsistency: "El último saldo del ledger no coincide con el stock actual.",
			});
		}
	}

	return issues.length === 0
		? {
				id: "inventory-ledger-integrity",
				status: "pass",
				message: "El ledger de inventario es consistente con los productos.",
			}
		: {
				id: "inventory-ledger-integrity",
				status: "fail",
				message: "Se encontraron inconsistencias en el ledger de inventario.",
				details: { issueCount: issues.length, issues },
			};
}

async function runDeepChecks(database: BodegixDatabase): Promise<DatabaseDiagnosticCheck[]> {
	const [saleIds, cashSessionIds] = await Promise.all([
		database.sales.toCollection().primaryKeys(),
		database.cashSessions.toCollection().primaryKeys(),
	]);
	const sales = new Set(saleIds);
	const cashSessions = new Set(cashSessionIds);

	let orphanSaleItems = 0;
	let orphanSalePayments = 0;
	let orphanSales = 0;
	let orphanCashMovements = 0;

	await Promise.all([
		database.saleItems.each(({ saleId }) => {
			if (!sales.has(saleId)) orphanSaleItems += 1;
		}),
		database.salePayments.each(({ saleId }) => {
			if (!sales.has(saleId)) orphanSalePayments += 1;
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
		await inventoryLedgerCheck(database),
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

		const expectedTables = Object.keys(SCHEMA_V2).sort();
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
