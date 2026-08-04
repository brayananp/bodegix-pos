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
import { useSaleDetail, useSaleVoidEligibility } from "../hooks";
import { VoidSaleForm } from "./void-sale-form";

interface SaleDetailSheetProps {
	saleId: string;
	onClose: () => void;
}

/**
 * Sheet para mostrar el detalle completo de una venta.
 *
 * Incluye:
 * - Información general (número, estado, fecha)
 * - Lista de items vendidos
 * - Lista de pagos
 * - Botón para anular (si es elegible)
 */
export function SaleDetailSheet({ saleId, onClose }: SaleDetailSheetProps) {
	const sale = useSaleDetail(saleId);
	const eligibility = useSaleVoidEligibility(saleId);

	return (
		<Sheet
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<SheetContent
				side="right"
				showCloseButton={false}
				className="h-dvh w-full max-w-none gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-170"
			>
				<SheetHeader className="shrink-0 border-b pr-4 md:px-6">
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="flex items-center gap-2">
								<SheetTitle>{sale ? `Venta #${sale.saleNumber}` : "Detalle de venta"}</SheetTitle>
								{sale && <SaleStatusBadge status={sale.status} />}
							</div>
							<SheetDescription>
								{sale
									? `${formatDate(sale.createdAt)}${
											sale.voidedAt ? ` · Anulada el ${formatDate(sale.voidedAt)}` : ""
									  }`
									: "Consulta el detalle completo de la venta"}
							</SheetDescription>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							Cerrar
						</Button>
					</div>
				</SheetHeader>

				<div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
					{sale === undefined ? (
						<p className="text-sm text-muted-foreground">Cargando venta…</p>
					) : sale === null ? (
						<Alert>
							<AlertTitle>Venta no disponible</AlertTitle>
							<AlertDescription>
								La venta solicitada no existe o ya no está disponible en este dispositivo.
							</AlertDescription>
						</Alert>
					) : (
						<div className="space-y-6">
							{/* Motivo de anulación si existe */}
							{sale.voidReason && (
								<Alert variant="destructive">
									<AlertTitle>Motivo de anulación</AlertTitle>
									<AlertDescription>{sale.voidReason}</AlertDescription>
								</Alert>
							)}

							{/* Items */}
							<section>
								<h3 className="mb-3 text-sm font-semibold">Productos</h3>
								<div className="space-y-2">
									{sale.items.map((item) => (
										<div
											key={item.id}
											className="flex items-start justify-between gap-4 rounded-lg border bg-card p-3"
										>
											<div className="flex-1 min-w-0">
												<p className="font-medium text-sm truncate">{item.productName}</p>
												<p className="text-xs text-muted-foreground tabular-nums">
													{item.quantity} × {formatMoney(item.unitPriceCents)}
												</p>
											</div>
											<p className="font-semibold text-sm tabular-nums whitespace-nowrap">
												{formatMoney(item.subtotalCents)}
											</p>
										</div>
									))}
								</div>
							</section>

							{/* Pagos */}
							<section>
								<h3 className="mb-3 text-sm font-semibold">Pagos</h3>
								<div className="space-y-2">
									{sale.payments.map((payment) => (
										<div
											key={payment.id}
											className="flex items-start justify-between gap-4 rounded-lg border bg-card p-3"
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<p className="font-medium text-sm">
														{getPaymentMethodLabel(payment.method)}
													</p>
													{payment.status === "voided" && (
														<Badge variant="destructive" className="text-xs">
															Anulado
														</Badge>
													)}
												</div>
												{payment.operationReference && (
													<p className="text-xs text-muted-foreground truncate">
														Ref: {payment.operationReference}
													</p>
												)}
												{payment.cashReceivedCents !== null && payment.changeCents !== null && (
													<p className="text-xs text-muted-foreground tabular-nums">
														Recibido: {formatMoney(payment.cashReceivedCents)} · Vuelto:{" "}
														{formatMoney(payment.changeCents)}
													</p>
												)}
											</div>
											<p className="font-semibold text-sm tabular-nums whitespace-nowrap">
												{formatMoney(payment.amountCents)}
											</p>
										</div>
									))}
								</div>
							</section>

							{/* Total */}
							<div className="rounded-lg border bg-muted/50 p-4">
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium">Subtotal</span>
									<span className="tabular-nums">{formatMoney(sale.subtotalCents)}</span>
								</div>
								<div className="mt-3 flex items-center justify-between border-t pt-3">
									<span className="font-semibold">Total</span>
									<span className="text-lg font-bold tabular-nums">
										{formatMoney(sale.totalCents)}
									</span>
								</div>
							</div>

							{/* Formulario de anulación */}
							{eligibility?.canVoid && sale.status === "completed" && (
								<VoidSaleForm saleId={sale.id} saleNumber={sale.saleNumber} onSuccess={onClose} />
							)}

							{/* Mensaje de no elegible */}
							{eligibility && !eligibility.canVoid && sale.status === "completed" && (
								<Alert>
									<AlertTitle>No se puede anular esta venta</AlertTitle>
									<AlertDescription>{getIneligibilityMessage(eligibility.reason)}</AlertDescription>
								</Alert>
							)}
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

function SaleStatusBadge({ status }: { status: "completed" | "voided" }) {
	if (status === "completed") {
		return (
			<Badge variant="default" className="bg-green-600">
				Completada
			</Badge>
		);
	}
	return <Badge variant="destructive">Anulada</Badge>;
}

function formatDate(timestamp: number): string {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(timestamp);
}

function getPaymentMethodLabel(method: string): string {
	switch (method) {
		case "cash":
			return "Efectivo";
		case "yape":
			return "Yape";
		case "plin":
			return "Plin";
		case "card":
			return "Tarjeta";
		case "bank_transfer":
			return "Transferencia";
		default:
			return method;
	}
}

function getIneligibilityMessage(
	reason: "ALREADY_VOIDED" | "SESSION_CLOSED" | "SESSION_MISMATCH" | undefined,
): string {
	switch (reason) {
		case "ALREADY_VOIDED":
			return "Esta venta ya fue anulada previamente.";
		case "SESSION_CLOSED":
			return "Solo puedes anular ventas de la sesión de caja actual mientras esté abierta.";
		case "SESSION_MISMATCH":
			return "Esta venta pertenece a otra sesión de caja. Solo puedes anular ventas de la sesión actual.";
		default:
			return "Esta venta no puede ser anulada en este momento.";
	}
}
