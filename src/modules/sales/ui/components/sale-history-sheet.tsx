import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import { formatMoney } from "@/shared/kernel/money";
import { ArrowLeft02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SaleHistoryPanelMode } from "../sales-history-search";
import { formatSalesDate, PAYMENT_METHOD_LABELS } from "../sales-format";
import { useSaleDetail, useSaleVoidResult } from "../hooks";
import { VoidSaleForm } from "../forms/void-sale/void-sale-form";

export function SaleHistorySheet({
	saleId,
	mode,
	onClose,
	onBack,
	onStartVoid,
	onVoided,
}: {
	saleId: string;
	mode: SaleHistoryPanelMode;
	onClose(): void;
	onBack(): void;
	onStartVoid(): void;
	onVoided(): void;
}) {
	const sale = useSaleDetail(saleId);
	const result = useSaleVoidResult(mode === "void-result" ? saleId : null);

	useEffect(() => {
		if (sale === null) onClose();
	}, [onClose, sale]);

	const title =
		mode === "void"
			? "Anular venta"
			: mode === "void-result"
				? "Venta anulada"
				: "Detalle de venta";
	return (
		<Sheet open onOpenChange={(open) => !open && onClose()}>
			<SheetContent
				side="right"
				showCloseButton={false}
				className="h-dvh w-full max-w-none gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[720px]"
			>
				<SheetHeader className="shrink-0 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
					<div className="flex items-start gap-3">
						{mode !== "detail" && (
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={onBack}
								aria-label="Volver al detalle"
							>
								<HugeiconsIcon icon={ArrowLeft02Icon} />
							</Button>
						)}
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<SheetTitle>{title}</SheetTitle>
								{sale && <SaleStatusBadge status={sale.status} />}
							</div>
							<SheetDescription>
								{sale
									? `${sale.formattedSaleNumber} · ${formatMoney(sale.totalCents)} · registro histórico`
									: "Consultando la venta local…"}
							</SheetDescription>
						</div>
						<Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar detalle">
							<HugeiconsIcon icon={Cancel01Icon} />
						</Button>
					</div>
				</SheetHeader>

				{sale === undefined ? (
					<div className="p-6 text-sm text-muted-foreground">Cargando venta…</div>
				) : sale === null ? null : mode === "void" ? (
					<VoidSaleForm key={sale.id} sale={sale} onCancel={onBack} onSuccess={onVoided} />
				) : mode === "void-result" ? (
					<VoidResult saleNumber={sale.formattedSaleNumber} result={result} onClose={onClose} />
				) : (
					<SaleDetailContent sale={sale} onStartVoid={onStartVoid} />
				)}
			</SheetContent>
		</Sheet>
	);
}

function SaleDetailContent({
	sale,
	onStartVoid,
}: {
	sale: NonNullable<ReturnType<typeof useSaleDetail>>;
	onStartVoid(): void;
}) {
	if (!sale) return null;
	return (
		<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
			<div className="space-y-6">
				<section className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
					<DetailDatum label="Registrada" value={formatSalesDate(sale.createdAt)} />
					<DetailDatum
						label="Sesión de caja"
						value={`${sale.cashSessionId.slice(0, 8)} · ${sale.cashSessionStatus === "open" ? "Abierta" : sale.cashSessionStatus === "closed" ? "Cerrada" : "No disponible"}`}
					/>
					{sale.voidedAt && <DetailDatum label="Anulada" value={formatSalesDate(sale.voidedAt)} />}
					{sale.voidReason && <DetailDatum label="Motivo" value={sale.voidReason} />}
				</section>

				<DetailSection title="Productos vendidos">
					{sale.items.map((item) => (
						<div
							key={item.id}
							className="flex items-start justify-between gap-4 rounded-lg border bg-card p-3"
						>
							<div className="min-w-0">
								<p className="font-medium">{item.productName}</p>
								<p className="text-xs text-muted-foreground">
									{item.quantity} × {formatMoney(item.unitPriceCents)} · costo histórico{" "}
									{item.unitCostCents === null ? "no registrado" : formatMoney(item.unitCostCents)}
								</p>
								{!item.productAvailable && (
									<p className="text-xs text-amber-700">Producto actual no disponible</p>
								)}
							</div>
							<strong className="tabular-nums">{formatMoney(item.subtotalCents)}</strong>
						</div>
					))}
				</DetailSection>

				<DetailSection title="Pagos originales">
					{sale.payments.map((payment) => (
						<div key={payment.id} className="rounded-lg border bg-card p-3">
							<div className="flex justify-between gap-3">
								<div>
									<p className="font-medium">{PAYMENT_METHOD_LABELS[payment.method]}</p>
									<p className="text-xs text-muted-foreground">
										{payment.status === "voided" ? "Anulado" : "Activo"} · verificado{" "}
										{formatSalesDate(payment.verifiedAt)}
									</p>
								</div>
								<strong className="tabular-nums">{formatMoney(payment.amountCents)}</strong>
							</div>
							{payment.operationReference && (
								<p className="mt-2 text-xs">Operación original: {payment.operationReference}</p>
							)}
							{payment.cashReceivedCents !== null && payment.changeCents !== null && (
								<p className="mt-1 text-xs text-muted-foreground">
									Recibido {formatMoney(payment.cashReceivedCents)} · vuelto{" "}
									{formatMoney(payment.changeCents)}
								</p>
							)}
							{payment.voidedAt && (
								<p className="mt-2 text-xs">
									Anulado {formatSalesDate(payment.voidedAt)}
									{payment.voidOperationReference
										? ` · devolución ${payment.voidOperationReference}`
										: ""}
								</p>
							)}
						</div>
					))}
				</DetailSection>

				<DetailSection title="Movimientos de inventario relacionados">
					{sale.inventoryMovements.map((movement) => (
						<div
							key={movement.id}
							className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border bg-card p-3 text-sm"
						>
							<div>
								<p className="font-medium">{movement.productName}</p>
								<p className="text-xs text-muted-foreground">
									{movement.type === "sale" ? "Salida por venta" : "Restauración por anulación"} ·{" "}
									{formatSalesDate(movement.createdAt)}
								</p>
							</div>
							<div className="text-right">
								<p className="font-semibold tabular-nums">
									{movement.quantityDelta > 0 ? "+" : ""}
									{movement.quantityDelta}
								</p>
								<p className="text-xs text-muted-foreground">
									{movement.stockBefore} → {movement.stockAfter}
								</p>
							</div>
						</div>
					))}
				</DetailSection>

				<div className="rounded-xl border bg-muted/30 p-4">
					<div className="flex justify-between text-sm">
						<span>Subtotal</span>
						<span>{formatMoney(sale.subtotalCents)}</span>
					</div>
					<div className="mt-3 flex justify-between border-t pt-3 text-lg font-semibold">
						<span>Total</span>
						<span>{formatMoney(sale.totalCents)}</span>
					</div>
				</div>

				{sale.status === "completed" && sale.voidEligibility.eligible && (
					<Button variant="destructive" className="min-h-11 w-full" onClick={onStartVoid}>
						Preparar anulación completa
					</Button>
				)}
				{sale.status === "completed" && !sale.voidEligibility.eligible && (
					<Alert>
						<AlertTitle>Anulación no disponible</AlertTitle>
						<AlertDescription>{eligibilityMessage(sale.voidEligibility.reason)}</AlertDescription>
					</Alert>
				)}
			</div>
		</div>
	);
}

function VoidResult({
	saleNumber,
	result,
	onClose,
}: {
	saleNumber: string;
	result: ReturnType<typeof useSaleVoidResult>;
	onClose(): void;
}) {
	return (
		<div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6" aria-live="polite">
			{result ? (
				<div className="space-y-5">
					<div className="rounded-2xl border border-emerald-600/30 bg-emerald-500/10 p-5">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
							Operación completada
						</p>
						<h2 className="mt-2 text-xl font-semibold">{saleNumber} fue anulada</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							Se restauraron {result.restoredUnitCount} unidades y se marcaron{" "}
							{result.paymentReversals.length} pagos como anulados.
						</p>
					</div>
					<div className="space-y-2">
						{result.paymentReversals.map((payment) => (
							<div
								key={payment.method}
								className="flex justify-between rounded-lg border p-3 text-sm"
							>
								<span>
									{PAYMENT_METHOD_LABELS[payment.method]}
									{payment.reversalReference ? ` · ${payment.reversalReference}` : ""}
								</span>
								<strong>{formatMoney(payment.amountCents)}</strong>
							</div>
						))}
					</div>
					<Button className="w-full" onClick={onClose}>
						Volver al historial
					</Button>
				</div>
			) : (
				<p className="text-sm text-muted-foreground">Reconstruyendo resultado…</p>
			)}
		</div>
	);
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="space-y-2">
			<h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
				{title}
			</h3>
			{children}
		</section>
	);
}
function DetailDatum({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-sm font-medium">{value}</p>
		</div>
	);
}
function SaleStatusBadge({ status }: { status: "completed" | "voided" }) {
	return (
		<Badge variant={status === "voided" ? "destructive" : "secondary"}>
			{status === "voided" ? "Anulada" : "Completada"}
		</Badge>
	);
}
function eligibilityMessage(reason: string | null): string {
	if (reason === "CASH_SESSION_CLOSED")
		return "Esta venta pertenece a una caja ya cerrada. Las devoluciones posteriores al cierre no están disponibles en el MVP.";
	if (reason === "DIFFERENT_OPEN_SESSION")
		return "La sesión abierta actual no es la sesión original de esta venta.";
	if (reason === "CASH_SESSION_NOT_FOUND")
		return "La sesión original no está disponible; ejecuta el diagnóstico.";
	if (reason === "SALE_DATA_INCONSISTENT")
		return "Los datos de la venta son inconsistentes; ejecuta el diagnóstico antes de continuar.";
	return "Esta venta ya no es elegible para anulación.";
}
