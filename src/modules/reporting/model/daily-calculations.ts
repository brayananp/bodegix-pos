import type {
	DailyCloseChecklist,
	DailyCloseChecklistInput,
	DailyOperationalStatus,
	DailyOperationalStatusInput,
	DailyPaymentSummary,
} from "./daily-operational-summary";
import { ReportingError } from "./reporting-error";

export function requireSafeInteger(value: number, label: string): number {
	if (!Number.isSafeInteger(value))
		throw new ReportingError("INVALID_REPORTING_VALUE", `${label} debe ser un entero seguro`);
	return value;
}

export function safeSum(values: readonly number[], label = "total"): number {
	return values.reduce((sum, value) => {
		requireSafeInteger(value, label);
		const next = sum + value;
		if (!Number.isSafeInteger(next))
			throw new ReportingError("REPORTING_OVERFLOW", `${label} excede el rango seguro`);
		return next;
	}, 0);
}

export function calculateAverageTicket(totalCents: number, saleCount: number): number {
	requireSafeInteger(totalCents, "totalCents");
	requireSafeInteger(saleCount, "saleCount");
	if (totalCents < 0 || saleCount < 0)
		throw new ReportingError("INVALID_REPORTING_VALUE", "Los totales no pueden ser negativos");
	return saleCount === 0 ? 0 : Math.round(totalCents / saleCount);
}

export function calculatePaymentTotal(summary: Omit<DailyPaymentSummary, "totalCents">): number {
	return safeSum(
		[
			summary.cashCents,
			summary.yapeCents,
			summary.plinCents,
			summary.cardCents,
			summary.bankTransferCents,
		],
		"pagos",
	);
}

export function calculateNetOperationalCashFlow(
	cashSalesCents: number,
	depositsCents: number,
	withdrawalsCents: number,
): number {
	return safeSum([cashSalesCents, depositsCents, -withdrawalsCents], "flujo de caja");
}

export function determineDailyOperationalStatus(
	input: DailyOperationalStatusInput,
): DailyOperationalStatus {
	requireSafeInteger(input.openSessionCount, "openSessionCount");
	if (!input.hasActivity) return "no_activity";
	return input.openSessionCount > 0 ? "in_progress" : "ready_for_review";
}

export function buildDailyCloseChecklist(input: DailyCloseChecklistInput): DailyCloseChecklist {
	const cashSessionsClosed = input.openSessionCount === 0;
	const saleDraftEmpty = input.saleDraftItemCount === 0;
	const items: DailyCloseChecklist["items"] = [
		{
			id: "cash-sessions",
			status: cashSessionsClosed ? "pass" : "warning",
			title: cashSessionsClosed ? "Cajas relacionadas cerradas" : "Caja pendiente de cierre",
			description: cashSessionsClosed
				? "No hay sesiones abiertas que intersecten esta fecha."
				: "Cierra la sesión desde Caja cuando termine la operación.",
			action: cashSessionsClosed ? null : "cash",
		},
		{
			id: "sale-draft",
			status: saleDraftEmpty ? "pass" : "warning",
			title: saleDraftEmpty ? "Carrito vacío" : "Existe una venta sin terminar",
			description: saleDraftEmpty
				? "No hay productos pendientes en el carrito."
				: "Revisa la venta en curso; el resumen no elimina el carrito.",
			action: saleDraftEmpty ? null : "sale",
		},
		{
			id: "sales-consistency",
			status: input.salesConsistent ? "pass" : "fail",
			title: input.salesConsistent ? "Ventas consistentes" : "Ventas con inconsistencias",
			description: input.salesConsistent
				? "Cada venta válida tiene ítems y pagos que cuadran."
				: "Hay ventas sin detalle o cuyos importes no coinciden.",
			action: input.salesConsistent ? null : "diagnostics",
		},
		{
			id: "payments-consistency",
			status: input.paymentsConsistent ? "pass" : "fail",
			title: input.paymentsConsistent ? "Pagos conciliados" : "Pagos sin conciliar",
			description: input.paymentsConsistent
				? "El total de pagos coincide con las ventas válidas."
				: "El total de pagos no coincide con el total vendido.",
			action: input.paymentsConsistent ? null : "diagnostics",
		},
		{
			id: "recent-backup",
			status:
				input.backupStatus === "overdue" || input.backupStatus === "never" ? "warning" : "pass",
			title:
				input.backupStatus === "never"
					? "Aún no hay un respaldo manual"
					: input.backupStatus === "overdue"
						? "Respaldo atrasado"
						: input.backupStatus === "due_soon"
							? "Respaldo próximo"
							: "Respaldo al día",
			description:
				input.backupStatus === "never" || input.backupStatus === "overdue"
					? "Crea una copia portable antes de cerrar la jornada."
					: "La copia manual más reciente está dentro del plazo configurado.",
			action: input.backupStatus === "never" || input.backupStatus === "overdue" ? "backup" : null,
		},
	];
	const status = items.some(({ status }) => status === "fail")
		? "fail"
		: items.some(({ status }) => status === "warning")
			? "warning"
			: "pass";
	return {
		cashSessionsClosed,
		saleDraftEmpty,
		salesConsistent: input.salesConsistent,
		paymentsConsistent: input.paymentsConsistent,
		status,
		items,
	};
}
