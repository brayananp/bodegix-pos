import {
	appSettingsRecordSchema,
	type BodegixDatabase,
	type CashMovementRecord,
	type CashSessionRecord,
	type InventoryMovementRecord,
	type PaymentMethod,
	type SaleItemRecord,
	type SalePaymentRecord,
	type SaleRecord,
} from "@/shared/infrastructure/local-db";
import { getBusinessDayRange } from "@/shared/kernel/dates";
import type { DailyReportingQueries, GetDailyOperationalSummaryInput } from "../application";
import {
	ReportingError,
	buildDailyCloseChecklist,
	calculateAverageTicket,
	calculateNetOperationalCashFlow,
	calculatePaymentTotal,
	determineDailyOperationalStatus,
	requireSafeInteger,
	safeSum,
	type DailyCashSessionSummary,
	type DailyInventorySummary,
	type DailyOperationalSummary,
	type DailyPaymentSummary,
	type DailyTopProduct,
} from "../model";

const ACTIVE_PAYMENT_STATUSES = new Set(["confirmed", "manually_verified"]);

function bySaleId<T extends { saleId: string }>(records: T[]): Map<string, T[]> {
	const grouped = new Map<string, T[]>();
	for (const record of records) {
		const current = grouped.get(record.saleId) ?? [];
		current.push(record);
		grouped.set(record.saleId, current);
	}
	return grouped;
}

function positiveUnits(movement: InventoryMovementRecord): number {
	return Math.abs(requireSafeInteger(movement.quantityDelta, "cantidad de inventario"));
}

function sumAmounts<T>(records: T[], select: (record: T) => number, label: string): number {
	return safeSum(records.map(select), label);
}

function paymentField(method: PaymentMethod): keyof Omit<DailyPaymentSummary, "totalCents"> {
	if (method === "cash") return "cashCents";
	if (method === "yape") return "yapeCents";
	if (method === "plin") return "plinCents";
	if (method === "card") return "cardCents";
	return "bankTransferCents";
}

function buildPayments(payments: SalePaymentRecord[]): DailyPaymentSummary {
	const amounts: { -readonly [Key in keyof Omit<DailyPaymentSummary, "totalCents">]: number } = {
		cashCents: 0,
		yapeCents: 0,
		plinCents: 0,
		cardCents: 0,
		bankTransferCents: 0,
	};
	for (const payment of payments) {
		if (!ACTIVE_PAYMENT_STATUSES.has(payment.status)) continue;
		const field = paymentField(payment.method);
		amounts[field] = safeSum([amounts[field], payment.amountCents], `pagos ${payment.method}`);
	}
	return { ...amounts, totalCents: calculatePaymentTotal(amounts) };
}

function buildTopProducts(items: SaleItemRecord[], sales: SaleRecord[]): DailyTopProduct[] {
	const grouped = new Map<string, DailyTopProduct>();
	const saleDates = new Map(sales.map(({ id, createdAt }) => [id, createdAt]));
	const latestNameDates = new Map<string, number>();
	for (const item of items) {
		const previous = grouped.get(item.productId);
		const saleDate = saleDates.get(item.saleId) ?? 0;
		const productName =
			saleDate >= (latestNameDates.get(item.productId) ?? 0)
				? item.productName
				: (previous?.productName ?? item.productName);
		if (saleDate >= (latestNameDates.get(item.productId) ?? 0))
			latestNameDates.set(item.productId, saleDate);
		grouped.set(item.productId, {
			productId: item.productId,
			productName,
			unitsSold: safeSum([previous?.unitsSold ?? 0, item.quantity], "unidades vendidas"),
			revenueCents: safeSum([previous?.revenueCents ?? 0, item.subtotalCents], "ingresos"),
			lineCount: safeSum([previous?.lineCount ?? 0, 1], "líneas"),
		});
	}
	return [...grouped.values()]
		.sort(
			(left, right) =>
				right.unitsSold - left.unitsSold ||
				right.revenueCents - left.revenueCents ||
				left.productName.localeCompare(right.productName, "es", { sensitivity: "base" }),
		)
		.slice(0, 5);
}

function buildInventory(
	movements: InventoryMovementRecord[],
	completedItems: SaleItemRecord[],
	activeProducts: Array<{
		id: string;
		stockQuantity: number;
		minimumStockQuantity: number;
	}>,
	productsWithMovements: Set<string>,
): DailyInventorySummary {
	const units = (type: InventoryMovementRecord["type"]) =>
		sumAmounts(
			movements.filter((movement) => movement.type === type),
			positiveUnits,
			`movimientos ${type}`,
		);
	return {
		initialStockUnits: units("initial_stock"),
		purchaseEntryUnits: units("purchase"),
		adjustmentInUnits: units("adjustment_in"),
		adjustmentOutUnits: units("adjustment_out"),
		damagedUnits: units("damaged"),
		expiredUnits: units("expired"),
		soldUnits: sumAmounts(completedItems, ({ quantity }) => quantity, "unidades vendidas"),
		restoredByVoidUnits: units("sale_void"),
		currentLowStockProducts: activeProducts.filter(
			({ stockQuantity, minimumStockQuantity }) =>
				stockQuantity > 0 && minimumStockQuantity > 0 && stockQuantity <= minimumStockQuantity,
		).length,
		currentOutOfStockProducts: activeProducts.filter(({ stockQuantity }) => stockQuantity === 0)
			.length,
		currentProductsWithoutMovements: activeProducts.filter(
			({ id }) => !productsWithMovements.has(id),
		).length,
	};
}

function sessionProjection(
	session: CashSessionRecord,
	dayStart: number,
	dayEnd: number,
	openSales: SaleRecord[],
	openPayments: SalePaymentRecord[],
	openMovements: CashMovementRecord[],
): DailyCashSessionSummary {
	if (session.status === "closed") {
		return {
			id: session.id,
			status: "closed",
			openingCashCents: session.openingCashCents,
			cashSalesCents: session.cashSalesCents ?? 0,
			manualDepositsCents: session.manualDepositsCents ?? 0,
			manualWithdrawalsCents: session.manualWithdrawalsCents ?? 0,
			expectedCashCents: session.expectedCashCents,
			countedCashCents: session.countedCashCents,
			differenceCents: session.differenceCents,
			openedAt: session.openedAt,
			closedAt: session.closedAt,
			openedBeforeSelectedDay: session.openedAt < dayStart,
			closedAfterSelectedDay: (session.closedAt ?? dayEnd) >= dayEnd,
		};
	}
	const sales = openSales.filter(
		({ cashSessionId, status }) => cashSessionId === session.id && status === "completed",
	);
	const saleIds = new Set(sales.map(({ id }) => id));
	const payments = buildPayments(openPayments.filter(({ saleId }) => saleIds.has(saleId)));
	const movements = openMovements.filter(({ cashSessionId }) => cashSessionId === session.id);
	const deposits = sumAmounts(
		movements.filter(({ type }) => type === "deposit"),
		({ amountCents }) => amountCents,
		"depósitos de sesión",
	);
	const withdrawals = sumAmounts(
		movements.filter(({ type }) => type === "withdrawal"),
		({ amountCents }) => amountCents,
		"retiros de sesión",
	);
	const expected = safeSum(
		[session.openingCashCents, payments.cashCents, deposits, -withdrawals],
		"efectivo esperado",
	);
	return {
		id: session.id,
		status: "open",
		openingCashCents: session.openingCashCents,
		cashSalesCents: payments.cashCents,
		manualDepositsCents: deposits,
		manualWithdrawalsCents: withdrawals,
		expectedCashCents: expected,
		countedCashCents: null,
		differenceCents: null,
		openedAt: session.openedAt,
		closedAt: null,
		openedBeforeSelectedDay: session.openedAt < dayStart,
		closedAfterSelectedDay: true,
	};
}

export class DexieDailyReportingQueries implements DailyReportingQueries {
	constructor(private readonly database: BodegixDatabase) {}

	async getDailyOperationalSummary(
		input: GetDailyOperationalSummaryInput,
	): Promise<DailyOperationalSummary> {
		const settings = appSettingsRecordSchema.safeParse(await this.database.appSettings.get("main"));
		if (!settings.success)
			throw new ReportingError(
				"REPORTING_SETTINGS_MISSING",
				"La configuración comercial no está disponible",
			);
		if (input.timezone !== settings.data.timezone)
			throw new ReportingError(
				"INVALID_REPORTING_PERIOD",
				"La zona solicitada no coincide con la configuración comercial",
			);
		let range: ReturnType<typeof getBusinessDayRange>;
		try {
			range = getBusinessDayRange(input.date, input.timezone);
		} catch (error) {
			throw new ReportingError("INVALID_REPORTING_PERIOD", "Periodo comercial inválido", {
				cause: error,
			});
		}
		const { start, endExclusive } = range;
		const [
			createdSales,
			voidOperations,
			dayMovements,
			relatedSessions,
			inventoryMovements,
			products,
			draft,
			movementProductKeys,
		] = await Promise.all([
			this.database.sales.where("createdAt").between(start, endExclusive, true, false).toArray(),
			this.database.sales
				.where("[status+voidedAt]")
				.between(["voided", start], ["voided", endExclusive], true, false)
				.toArray(),
			this.database.cashMovements
				.where("createdAt")
				.between(start, endExclusive, true, false)
				.toArray(),
			this.database.cashSessions
				.where("openedAt")
				.below(endExclusive)
				.filter(({ closedAt }) => closedAt === null || closedAt >= start)
				.toArray(),
			this.database.inventoryMovements
				.where("createdAt")
				.between(start, endExclusive, true, false)
				.toArray(),
			this.database.products.toArray(),
			this.database.saleDrafts.get("main"),
			this.database.inventoryMovements.orderBy("productId").uniqueKeys(),
		]);

		const completedSales = createdSales.filter(({ status }) => status === "completed");
		const voidedCreatedSales = createdSales.filter(({ status }) => status === "voided");
		const completedSaleIds = completedSales.map(({ id }) => id);
		const openSessionIds = relatedSessions
			.filter(({ status }) => status === "open")
			.map(({ id }) => id);
		const [completedItems, completedPayments, openSales, openMovements] = await Promise.all([
			completedSaleIds.length
				? this.database.saleItems.where("saleId").anyOf(completedSaleIds).toArray()
				: Promise.resolve([]),
			completedSaleIds.length
				? this.database.salePayments.where("saleId").anyOf(completedSaleIds).toArray()
				: Promise.resolve([]),
			openSessionIds.length
				? this.database.sales.where("cashSessionId").anyOf(openSessionIds).toArray()
				: Promise.resolve([]),
			openSessionIds.length
				? this.database.cashMovements.where("cashSessionId").anyOf(openSessionIds).toArray()
				: Promise.resolve([]),
		]);
		const openSaleIds = openSales
			.filter(({ status }) => status === "completed")
			.map(({ id }) => id);
		const openPayments = openSaleIds.length
			? await this.database.salePayments.where("saleId").anyOf(openSaleIds).toArray()
			: [];

		const salesTotal = sumAmounts(completedSales, ({ totalCents }) => totalCents, "ventas");
		const payments = buildPayments(completedPayments);
		const itemsBySale = bySaleId(completedItems);
		const paymentsBySale = bySaleId(
			completedPayments.filter(({ status }) => ACTIVE_PAYMENT_STATUSES.has(status)),
		);
		const salesConsistent = completedSales.every((sale) => {
			const items = itemsBySale.get(sale.id) ?? [];
			const salePayments = paymentsBySale.get(sale.id) ?? [];
			return (
				items.length > 0 &&
				salePayments.length > 0 &&
				sumAmounts(items, ({ subtotalCents }) => subtotalCents, "ítems") === sale.totalCents &&
				sumAmounts(salePayments, ({ amountCents }) => amountCents, "pagos de venta") ===
					sale.totalCents
			);
		});
		const sessions = relatedSessions
			.map((session) =>
				sessionProjection(session, start, endExclusive, openSales, openPayments, openMovements),
			)
			.sort((left, right) => left.openedAt - right.openedAt);
		const manualDepositsCents = sumAmounts(
			dayMovements.filter(({ type }) => type === "deposit"),
			({ amountCents }) => amountCents,
			"depósitos diarios",
		);
		const manualWithdrawalsCents = sumAmounts(
			dayMovements.filter(({ type }) => type === "withdrawal"),
			({ amountCents }) => amountCents,
			"retiros diarios",
		);
		const closedToday = sessions.filter(
			({ status, closedAt }) =>
				status === "closed" && closedAt !== null && closedAt >= start && closedAt < endExclusive,
		);
		const cash = {
			relatedSessionCount: sessions.length,
			openSessionCount: sessions.filter(({ status }) => status === "open").length,
			closedSessionCount: sessions.filter(({ status }) => status === "closed").length,
			cashSalesCents: payments.cashCents,
			manualDepositsCents,
			manualWithdrawalsCents,
			netOperationalCashFlowCents: calculateNetOperationalCashFlow(
				payments.cashCents,
				manualDepositsCents,
				manualWithdrawalsCents,
			),
			closedSessionDifferenceCents: safeSum(
				closedToday.map(({ differenceCents }) => differenceCents ?? 0),
				"diferencias de caja",
			),
			sessions,
		};
		const openSessionCount = cash.openSessionCount;
		const closeChecklist = buildDailyCloseChecklist({
			openSessionCount,
			saleDraftItemCount: draft?.items.length ?? 0,
			salesConsistent,
			paymentsConsistent: payments.totalCents === salesTotal,
		});
		const activeProducts = products.filter(({ isActive }) => isActive);
		const inventory = buildInventory(
			inventoryMovements,
			completedItems,
			activeProducts,
			new Set(movementProductKeys.filter((key): key is string => typeof key === "string")),
		);
		const hasActivity =
			createdSales.length > 0 ||
			voidOperations.length > 0 ||
			dayMovements.length > 0 ||
			inventoryMovements.length > 0 ||
			relatedSessions.length > 0;
		return {
			date: input.date,
			timezone: input.timezone,
			periodStart: start,
			periodEndExclusive: endExclusive,
			generatedAt: Date.now(),
			status: determineDailyOperationalStatus({ hasActivity, openSessionCount }),
			sales: {
				completedSalesCount: completedSales.length,
				completedSalesCents: salesTotal,
				voidedSalesCreatedCount: voidedCreatedSales.length,
				voidedSalesCreatedCents: sumAmounts(
					voidedCreatedSales,
					({ totalCents }) => totalCents,
					"ventas anuladas creadas",
				),
				voidOperationsCount: voidOperations.length,
				voidOperationsCents: sumAmounts(
					voidOperations,
					({ totalCents }) => totalCents,
					"anulaciones procesadas",
				),
				lineCount: completedItems.length,
				unitCount: sumAmounts(completedItems, ({ quantity }) => quantity, "unidades vendidas"),
				averageTicketCents: calculateAverageTicket(salesTotal, completedSales.length),
			},
			payments,
			cash,
			inventory,
			topProducts: buildTopProducts(completedItems, completedSales),
			recentSales: [...completedSales]
				.sort((left, right) => right.createdAt - left.createdAt)
				.slice(0, 5)
				.map((sale) => ({
					id: sale.id,
					saleNumber: sale.saleNumber,
					formattedSaleNumber: `V-${sale.saleNumber.toString().padStart(6, "0")}`,
					totalCents: sale.totalCents,
					paymentMethods: [
						...new Set((paymentsBySale.get(sale.id) ?? []).map(({ method }) => method)),
					],
					createdAt: sale.createdAt,
				})),
			closeChecklist,
		};
	}
}
