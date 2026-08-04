import { Badge } from "@/shared/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatMoney } from "@/shared/kernel/money";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSaleDetail, useSaleVoidEligibility } from "../hooks";
import { VoidSaleForm } from "./void-sale-form";

interface SaleDetailSheetProps {
	saleId: string | null;
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

	const isOpen = saleId !== null;

	if (!isOpen) return null;

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full sm:max-w-lg overflow-y-auto">
				{!sale ? (
					<SaleDetailSkeleton />
				) : (
					<>
						<SheetHeader>
							<div className="flex items-center justify-between">
								<SheetTitle>Venta #{sale.saleNumber}</SheetTitle>
								<SaleStatusBadge status={sale.status} />
							</div>
							<SheetDescription>
								{formatDate(sale.createdAt)}
								{sale.voidedAt && ` · Anulada el ${formatDate(sale.voidedAt)}`}
							</SheetDescription>
						</SheetHeader>

						<div className="mt-6 space-y-6">
							{/* Motivo de anulación si existe */}
							{sale.voidReason && (
								<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
									<h3 className="text-sm font-semibold text-destructive mb-1">
										Motivo de anulación
									</h3>
									<p className="text-sm text-muted-foreground">{sale.voidReason}</p>
								</div>
							)}

							{/* Items */}
							<div>
								<h3 className="text-sm font-semibold mb-3">Productos</h3>
								<div className="space-y-2">
									{sale.items.map((item) => (
										<div
											key={item.id}
											className="flex items-start justify-between rounded-lg border p-3"
										>
											<div className="flex-1">
												<p className="font-medium text-sm">{item.productName}</p>
												<p className="text-xs text-muted-foreground">
													{item.quantity} × {formatMoney(item.unitPriceCents)}
												</p>
											</div>
											<p className="font-semibold text-sm">{formatMoney(item.subtotalCents)}</p>
										</div>
									))}
								</div>
							</div>

							{/* Pagos */}
							<div>
								<h3 className="text-sm font-semibold mb-3">Pagos</h3>
								<div className="space-y-2">
									{sale.payments.map((payment) => (
										<div
											key={payment.id}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<div className="flex-1">
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
													<p className="text-xs text-muted-foreground">
														Ref: {payment.operationReference}
													</p>
												)}
												{payment.cashReceivedCents !== null && payment.changeCents !== null && (
													<p className="text-xs text-muted-foreground">
														Recibido: {formatMoney(payment.cashReceivedCents)} · Vuelto:{" "}
														{formatMoney(payment.changeCents)}
													</p>
												)}
											</div>
											<p className="font-semibold text-sm">{formatMoney(payment.amountCents)}</p>
										</div>
									))}
								</div>
							</div>

							{/* Total */}
							<div className="rounded-lg border bg-muted/50 p-4">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Subtotal</span>
									<span className="text-sm">{formatMoney(sale.subtotalCents)}</span>
								</div>
								<div className="mt-2 flex items-center justify-between border-t pt-2">
									<span className="font-semibold">Total</span>
									<span className="text-lg font-bold">{formatMoney(sale.totalCents)}</span>
								</div>
							</div>

							{/* Formulario de anulación */}
							{eligibility?.canVoid && sale.status === "completed" && (
								<VoidSaleForm saleId={sale.id} saleNumber={sale.saleNumber} onSuccess={onClose} />
							)}

							{/* Mensaje de no elegible */}
							{eligibility && !eligibility.canVoid && sale.status === "completed" && (
								<div className="rounded-lg border border-muted bg-muted/50 p-4">
									<div className="flex items-start gap-3">
										<HugeiconsIcon
											icon={Cancel01Icon}
											className="size-5 text-muted-foreground mt-0.5"
										/>
										<div>
											<p className="text-sm font-medium">No se puede anular esta venta</p>
											<p className="text-xs text-muted-foreground mt-1">
												{getIneligibilityMessage(eligibility.reason)}
											</p>
										</div>
									</div>
								</div>
							)}
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

function SaleDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-8 w-32 mb-2" />
				<Skeleton className="h-4 w-48" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
			</div>
		</div>
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
			return "Esta venta no puede ser anulada.";
	}
}
