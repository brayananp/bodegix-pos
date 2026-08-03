import type { BodegixDatabase } from "../bodegix-database";
import { LocalDatabaseError } from "../database-errors";
import { appSettingsRecordSchema } from "../records";
import { DATABASE_SCHEMA_VERSION, SCHEMA_V4 } from "../schema";
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

interface CashIntegrityIssue {
	severity: "error" | "warning";
	sessionId: string;
	movementId: string | null;
	inconsistency: string;
}

async function cashIntegrityCheck(database: BodegixDatabase): Promise<DatabaseDiagnosticCheck> {
	const [sessions, movements] = await Promise.all([
		database.cashSessions.toArray(),
		database.cashMovements.toArray(),
	]);
	const sessionsById = new Map(sessions.map((session) => [session.id, session]));
	const issues: CashIntegrityIssue[] = [];
	const snapshotFields = [
		"completedSalesCount",
		"totalSalesCents",
		"cashSalesCents",
		"yapeSalesCents",
		"plinSalesCents",
		"cardSalesCents",
		"bankTransferSalesCents",
		"manualDepositsCents",
		"manualWithdrawalsCents",
	] as const;

	for (const movement of movements) {
		const session = sessionsById.get(movement.cashSessionId);
		if (!session) {
			issues.push({
				severity: "error",
				sessionId: movement.cashSessionId,
				movementId: movement.id,
				inconsistency: "El movimiento referencia una sesión inexistente.",
			});
			continue;
		}
		if (!Number.isSafeInteger(movement.amountCents) || movement.amountCents <= 0) {
			issues.push({
				severity: "error",
				sessionId: session.id,
				movementId: movement.id,
				inconsistency: "El importe del movimiento debe ser un entero positivo.",
			});
		}
		const reasonLength = movement.reason.trim().length;
		if (reasonLength < 3 || reasonLength > 160) {
			issues.push({
				severity: "error",
				sessionId: session.id,
				movementId: movement.id,
				inconsistency: "El motivo del movimiento no es válido.",
			});
		}
		if (movement.createdAt < session.openedAt) {
			issues.push({
				severity: "error",
				sessionId: session.id,
				movementId: movement.id,
				inconsistency: "El movimiento es anterior a la apertura.",
			});
		}
		if (session.closedAt !== null && movement.createdAt > session.closedAt) {
			issues.push({
				severity: "error",
				sessionId: session.id,
				movementId: movement.id,
				inconsistency: "El movimiento es posterior al cierre.",
			});
		}
	}

	for (const session of sessions) {
		const monetaryValues = [
			session.openingCashCents,
			session.expectedCashCents,
			session.countedCashCents,
			...snapshotFields.map((field) => session[field]),
		].filter((value): value is number => value !== null);
		if (monetaryValues.some((value) => !Number.isSafeInteger(value) || value < 0)) {
			issues.push({
				severity: "error",
				sessionId: session.id,
				movementId: null,
				inconsistency: "La sesión contiene importes inválidos.",
			});
		}
		if (session.status === "open") {
			const hasClosingData =
				session.closedAt !== null ||
				session.expectedCashCents !== null ||
				session.countedCashCents !== null ||
				session.differenceCents !== null ||
				snapshotFields.some((field) => session[field] !== null);
			if (hasClosingData) {
				issues.push({
					severity: "error",
					sessionId: session.id,
					movementId: null,
					inconsistency: "Una sesión abierta contiene datos de cierre.",
				});
			}
			continue;
		}
		if (session.closedAt === null || session.closedAt < session.openedAt) {
			issues.push({
				severity: "error",
				sessionId: session.id,
				movementId: null,
				inconsistency: "La fecha de cierre es inválida.",
			});
		}
		if (
			session.expectedCashCents === null ||
			session.countedCashCents === null ||
			session.differenceCents === null
		) {
			issues.push({
				severity: "error",
				sessionId: session.id,
				movementId: null,
				inconsistency: "La sesión cerrada no tiene el cuadre completo.",
			});
		} else if (session.differenceCents !== session.countedCashCents - session.expectedCashCents) {
			issues.push({
				severity: "error",
				sessionId: session.id,
				movementId: null,
				inconsistency: "La diferencia no coincide con contado menos esperado.",
			});
		}
		if (snapshotFields.some((field) => session[field] === null)) {
			issues.push({
				severity: "warning",
				sessionId: session.id,
				movementId: null,
				inconsistency: "El desglose histórico no está disponible para esta sesión legada.",
			});
		} else {
			const snapshotExpectedCashCents =
				session.openingCashCents +
				(session.cashSalesCents ?? 0) +
				(session.manualDepositsCents ?? 0) -
				(session.manualWithdrawalsCents ?? 0);
			if (session.expectedCashCents !== snapshotExpectedCashCents) {
				issues.push({
					severity: "error",
					sessionId: session.id,
					movementId: null,
					inconsistency: "El efectivo esperado no coincide con el snapshot del cierre.",
				});
			}
		}
	}

	const hasErrors = issues.some(({ severity }) => severity === "error");
	return issues.length === 0
		? {
				id: "cash-integrity",
				status: "pass",
				message: "Las sesiones y movimientos de caja son consistentes.",
			}
		: {
				id: "cash-integrity",
				status: hasErrors ? "fail" : "warning",
				message: "Se encontraron inconsistencias en caja.",
				details: { issueCount: issues.length, issues },
			};
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

async function saleIntegrityCheck(database: BodegixDatabase): Promise<DatabaseDiagnosticCheck> {
	const [sales, saleItems, salePayments, inventoryMovements, settings, draft] = await Promise.all([
		database.sales.toArray(),
		database.saleItems.toArray(),
		database.salePayments.toArray(),
		database.inventoryMovements.toArray(),
		database.appSettings.get("main"),
		database.saleDrafts.get("main"),
	]);

	const issues: Array<{ saleId: string | null; detail: string }> = [];
	const saleIds = new Set(sales.map((s) => s.id));
	const saleNumbers = new Set<number>();

	for (const sale of sales) {
		if (!Number.isInteger(sale.saleNumber) || sale.saleNumber <= 0) {
			issues.push({ saleId: sale.id, detail: "saleNumber inválido." });
		}
		if (saleNumbers.has(sale.saleNumber)) {
			issues.push({ saleId: sale.id, detail: "saleNumber duplicado." });
		}
		saleNumbers.add(sale.saleNumber);
		if (sale.subtotalCents !== sale.totalCents) {
			issues.push({ saleId: sale.id, detail: "subtotalCents !== totalCents." });
		}
		if (sale.status === "completed" && (sale.voidedAt !== null || sale.voidReason !== null)) {
			issues.push({ saleId: sale.id, detail: "Venta completada con campos de anulación." });
		}
	}

	const itemsBySale = new Map<string, typeof saleItems>();
	for (const item of saleItems) {
		if (!saleIds.has(item.saleId)) {
			issues.push({ saleId: item.saleId, detail: "Ítem sin venta padre." });
			continue;
		}
		const expected = item.unitPriceCents * item.quantity;
		if (item.subtotalCents !== expected) {
			issues.push({ saleId: item.saleId, detail: "Subtotal de ítem incorrecto." });
		}
		const group = itemsBySale.get(item.saleId) ?? [];
		group.push(item);
		itemsBySale.set(item.saleId, group);
	}

	const paymentsBySale = new Map<string, typeof salePayments>();
	for (const payment of salePayments) {
		if (!saleIds.has(payment.saleId)) {
			issues.push({ saleId: payment.saleId, detail: "Pago sin venta padre." });
			continue;
		}
		const group = paymentsBySale.get(payment.saleId) ?? [];
		group.push(payment);
		paymentsBySale.set(payment.saleId, group);

		if (payment.method === "cash") {
			if (payment.status !== "confirmed") {
				issues.push({ saleId: payment.saleId, detail: "Pago en efectivo sin estado confirmado." });
			}
			if (payment.cashReceivedCents === null || payment.changeCents === null) {
				issues.push({ saleId: payment.saleId, detail: "Pago en efectivo sin recibido o vuelto." });
			} else if (payment.changeCents !== payment.cashReceivedCents - payment.amountCents) {
				issues.push({ saleId: payment.saleId, detail: "Vuelto incorrecto en efectivo." });
			}
		} else if (
			payment.cashReceivedCents !== null ||
			payment.changeCents !== null ||
			payment.status !== "manually_verified"
		) {
			issues.push({
				saleId: payment.saleId,
				detail: "Pago externo con datos de efectivo o sin verificación.",
			});
		}
	}

	for (const sale of sales) {
		const items = itemsBySale.get(sale.id) ?? [];
		const payments = paymentsBySale.get(sale.id) ?? [];
		if (items.length === 0) issues.push({ saleId: sale.id, detail: "Venta sin ítems." });
		if (payments.length === 0) issues.push({ saleId: sale.id, detail: "Venta sin pagos." });

		const itemsTotal = items.reduce((acc, item) => acc + item.subtotalCents, 0);
		if (itemsTotal !== sale.subtotalCents) {
			issues.push({ saleId: sale.id, detail: "Suma de ítems no coincide con subtotal." });
		}

		const paymentsTotal = payments.reduce((acc, payment) => acc + payment.amountCents, 0);
		if (paymentsTotal !== sale.totalCents) {
			issues.push({ saleId: sale.id, detail: "Suma de pagos no coincide con total." });
		}

		const methods = payments.map((p) => p.method);
		if (new Set(methods).size !== methods.length) {
			issues.push({ saleId: sale.id, detail: "Métodos de pago duplicados." });
		}

		const saleMovements = inventoryMovements.filter(
			(m) => m.referenceType === "sale" && m.referenceId === sale.id,
		);
		if (sale.status === "completed" && saleMovements.length !== items.length) {
			issues.push({ saleId: sale.id, detail: "Faltan movimientos de inventario por venta." });
		}
		for (const movement of saleMovements) {
			const item = items.find((i) => i.productId === movement.productId);
			if (!item || movement.quantityDelta !== -item.quantity) {
				issues.push({
					saleId: sale.id,
					detail: "Delta de movimiento no coincide con cantidad vendida.",
				});
			}
		}
	}

	if (settings) {
		const maxSaleNumber = sales.reduce((max, sale) => Math.max(max, sale.saleNumber), 0);
		if (settings.nextSaleNumber <= maxSaleNumber) {
			issues.push({
				saleId: null,
				detail: "nextSaleNumber no es mayor que el máximo correlativo confirmado.",
			});
		}
	}

	if (draft) {
		const productIds = new Set<string>();
		for (const item of draft.items) {
			if (productIds.has(item.productId)) {
				issues.push({ saleId: null, detail: "Borrador con productos duplicados." });
			}
			productIds.add(item.productId);
			if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
				issues.push({ saleId: null, detail: "Borrador con cantidad inválida." });
			}
			if (!Number.isInteger(item.expectedUnitPriceCents) || item.expectedUnitPriceCents <= 0) {
				issues.push({ saleId: null, detail: "Borrador con precio esperado inválido." });
			}
		}
	}

	return issues.length === 0
		? {
				id: "sales-integrity",
				status: "pass",
				message: "Las ventas, pagos e inventario son consistentes.",
			}
		: {
				id: "sales-integrity",
				status: "fail",
				message: "Se encontraron inconsistencias en ventas.",
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
		await saleIntegrityCheck(database),
		await inventoryLedgerCheck(database),
		await cashIntegrityCheck(database),
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

		const expectedTables = Object.keys(SCHEMA_V4).sort();
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
