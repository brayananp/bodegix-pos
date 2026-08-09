import { Alert02Icon, CheckmarkCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/shared/components/ui/badge";
import { buttonVariants } from "@/shared/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/components/ui/empty";
import { Progress } from "@/shared/components/ui/progress";
import { formatMoney } from "@/shared/kernel/money";
import { cn } from "@/shared/lib/utils";
import type {
	DailyCloseChecklist,
	DailyInventorySummary,
	DailyOperationalSummary,
	DailyPaymentSummary,
} from "../../model";

const PAYMENT_LABELS: Record<keyof Omit<DailyPaymentSummary, "totalCents">, string> = {
	cashCents: "Efectivo",
	yapeCents: "Yape",
	plinCents: "Plin",
	cardCents: "Tarjeta",
	bankTransferCents: "Transferencia",
};

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
	return (
		<Card size="sm">
			<CardHeader>
				<CardDescription className="text-xs font-medium uppercase tracking-[0.08em]">
					{label}
				</CardDescription>
				<CardTitle className="font-heading text-xl tabular-nums md:text-2xl">{value}</CardTitle>
			</CardHeader>
			{hint && <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>}
		</Card>
	);
}

export function KeyMetrics({ summary }: { summary: DailyOperationalSummary }) {
	return (
		<section aria-labelledby="main-metrics">
			<h2 id="main-metrics" className="sr-only">
				Indicadores principales
			</h2>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
				<Metric label="Ventas válidas" value={String(summary.sales.completedSalesCount)} />
				<Metric label="Total vendido" value={formatMoney(summary.sales.completedSalesCents)} />
				<Metric label="Ticket promedio" value={formatMoney(summary.sales.averageTicketCents)} />
				<Metric label="Unidades vendidas" value={String(summary.sales.unitCount)} />
				<Metric label="Anulaciones procesadas" value={String(summary.sales.voidOperationsCount)} />
			</div>
		</section>
	);
}

export function SalesAndPayments({ summary }: { summary: DailyOperationalSummary }) {
	const paymentEntries = Object.entries(PAYMENT_LABELS) as Array<
		[keyof typeof PAYMENT_LABELS, string]
	>;
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Ventas del periodo</CardTitle>
					<CardDescription>Dimensiones por creación y por fecha de anulación.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-2">
					<Metric
						label="Completadas"
						value={String(summary.sales.completedSalesCount)}
						hint={formatMoney(summary.sales.completedSalesCents)}
					/>
					<Metric
						label="Creadas y anuladas"
						value={String(summary.sales.voidedSalesCreatedCount)}
						hint={formatMoney(summary.sales.voidedSalesCreatedCents)}
					/>
					<Metric
						label="Anulaciones del día"
						value={String(summary.sales.voidOperationsCount)}
						hint={formatMoney(summary.sales.voidOperationsCents)}
					/>
					<Metric
						label="Líneas / unidades"
						value={`${summary.sales.lineCount} / ${summary.sales.unitCount}`}
					/>
				</CardContent>
				<CardFooter className="border-t">
					<SalesLink date={summary.date}>Ver historial filtrado</SalesLink>
				</CardFooter>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Métodos de pago</CardTitle>
					<CardDescription>Solo pagos activos de ventas completadas.</CardDescription>
					<CardAction>
						<Badge variant="outline">{formatMoney(summary.payments.totalCents)}</Badge>
					</CardAction>
				</CardHeader>
				<CardContent className="space-y-4">
					{paymentEntries.map(([field, label]) => {
						const value = summary.payments[field];
						const percent = summary.payments.totalCents
							? Math.round((value / summary.payments.totalCents) * 100)
							: 0;
						return (
							<div key={field} className="space-y-1.5">
								<div className="flex justify-between gap-4">
									<span>{label}</span>
									<span className="font-medium tabular-nums">{formatMoney(value)}</span>
								</div>
								<Progress value={percent} aria-label={`${label}: ${percent}%`} />
							</div>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}

export function CashSection({ summary }: { summary: DailyOperationalSummary }) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<Metric
					label="Flujo operativo"
					value={formatMoney(summary.cash.netOperationalCashFlowCents)}
				/>
				<Metric label="Ventas en efectivo" value={formatMoney(summary.cash.cashSalesCents)} />
				<Metric
					label="Depósitos / retiros"
					value={`${formatMoney(summary.cash.manualDepositsCents)} / ${formatMoney(summary.cash.manualWithdrawalsCents)}`}
				/>
				<Metric
					label="Diferencia de cierres"
					value={formatMoney(summary.cash.closedSessionDifferenceCents)}
				/>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Sesiones relacionadas</CardTitle>
					<CardDescription>
						Cada apertura conserva su propio efectivo inicial y snapshot.
					</CardDescription>
					<CardAction>
						<Badge variant="outline">{summary.cash.relatedSessionCount}</Badge>
					</CardAction>
				</CardHeader>
				<CardContent className="grid gap-3 lg:grid-cols-2">
					{summary.cash.sessions.length === 0 ? (
						<Empty className="col-span-full border">
							<EmptyHeader>
								<EmptyTitle>Sin sesiones relacionadas</EmptyTitle>
								<EmptyDescription>No hubo una caja que intersectara esta fecha.</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						summary.cash.sessions.map((session) => (
							<div key={session.id} className="rounded-xl border bg-muted/15 p-4">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="font-medium">Sesión {session.id.slice(0, 8)}</p>
										<p className="text-xs text-muted-foreground">
											Apertura{" "}
											{new Intl.DateTimeFormat("es-PE", {
												timeZone: summary.timezone,
												dateStyle: "short",
												timeStyle: "short",
											}).format(session.openedAt)}
										</p>
									</div>
									<Badge variant={session.status === "open" ? "secondary" : "outline"}>
										{session.status === "open" ? "Abierta" : "Cerrada"}
									</Badge>
								</div>
								<dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
									<div>
										<dt className="text-xs text-muted-foreground">Fondo inicial</dt>
										<dd className="font-medium tabular-nums">
											{formatMoney(session.openingCashCents)}
										</dd>
									</div>
									<div>
										<dt className="text-xs text-muted-foreground">Esperado</dt>
										<dd className="font-medium tabular-nums">
											{session.expectedCashCents === null
												? "—"
												: formatMoney(session.expectedCashCents)}
										</dd>
									</div>
									<div>
										<dt className="text-xs text-muted-foreground">Contado</dt>
										<dd className="font-medium tabular-nums">
											{session.countedCashCents === null
												? "—"
												: formatMoney(session.countedCashCents)}
										</dd>
									</div>
									<div>
										<dt className="text-xs text-muted-foreground">Diferencia</dt>
										<dd className="font-medium tabular-nums">
											{session.differenceCents === null
												? "—"
												: formatMoney(session.differenceCents)}
										</dd>
									</div>
								</dl>
								<Link
									to="/cash"
									search={{
										tab: "history",
										panel: "detail",
										sessionId: session.id,
										page: 1,
										pageSize: 25,
									}}
									className="mt-4 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
								>
									Ver sesión
								</Link>
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}

const INVENTORY_METRICS: Array<[keyof DailyInventorySummary, string]> = [
	["initialStockUnits", "Stock inicial"],
	["purchaseEntryUnits", "Compras"],
	["adjustmentInUnits", "Ajustes de entrada"],
	["adjustmentOutUnits", "Ajustes de salida"],
	["damagedUnits", "Dañados"],
	["expiredUnits", "Vencidos"],
	["soldUnits", "Vendidos"],
	["restoredByVoidUnits", "Restaurados por anulación"],
];

export function InventorySection({ summary }: { summary: DailyOperationalSummary }) {
	return (
		<div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
			<Card>
				<CardHeader>
					<CardTitle>Movimientos del periodo</CardTitle>
					<CardDescription>Unidades agrupadas por operación.</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-2 gap-x-5 gap-y-3">
					{INVENTORY_METRICS.map(([field, label]) => (
						<div key={field} className="flex items-center justify-between gap-3 border-b py-2">
							<span className="text-muted-foreground">{label}</span>
							<strong className="tabular-nums">{summary.inventory[field]}</strong>
						</div>
					))}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Estado actual del inventario</CardTitle>
					<CardDescription>Valores actuales; no reconstruyen stock histórico.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Metric label="Stock bajo" value={String(summary.inventory.currentLowStockProducts)} />
					<Metric label="Agotados" value={String(summary.inventory.currentOutOfStockProducts)} />
					<Metric
						label="Sin movimientos"
						value={String(summary.inventory.currentProductsWithoutMovements)}
					/>
				</CardContent>
				<CardFooter className="flex-wrap gap-2 border-t">
					<InventoryLink status="low_stock">Ver stock bajo</InventoryLink>
					<InventoryLink status="out_of_stock">Ver agotados</InventoryLink>
				</CardFooter>
			</Card>
		</div>
	);
}

export function TopProductsAndRecentSales({ summary }: { summary: DailyOperationalSummary }) {
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Productos más vendidos</CardTitle>
					<CardDescription>
						Ranking por unidades, usando el nombre guardado en la venta.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1">
					{summary.topProducts.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>Sin productos vendidos</EmptyTitle>
								<EmptyDescription>
									El ranking aparecerá con la primera venta válida.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						summary.topProducts.map((product, index) => (
							<div
								key={product.productId}
								className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b py-3 last:border-0"
							>
								<span className="font-heading text-lg text-muted-foreground">
									{String(index + 1).padStart(2, "0")}
								</span>
								<div className="min-w-0">
									<p className="truncate font-medium">{product.productName}</p>
									<p className="text-xs text-muted-foreground">
										{product.lineCount} líneas · {formatMoney(product.revenueCents)}
									</p>
								</div>
								<Badge variant="secondary">{product.unitsSold} u.</Badge>
							</div>
						))
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Últimas ventas</CardTitle>
					<CardDescription>Las cinco ventas válidas más recientes.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1">
					{summary.recentSales.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>Sin ventas recientes</EmptyTitle>
								<EmptyDescription>No hay ventas completadas en este día.</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						summary.recentSales.map((sale) => (
							<Link
								key={sale.id}
								to="/sales"
								search={{
									q: "",
									status: "all",
									paymentMethod: "all",
									range: "custom",
									from: summary.date,
									to: summary.date,
									cashSessionId: null,
									page: 1,
									pageSize: 25,
									sort: "newest",
									panel: "detail",
									saleId: sale.id,
								}}
								className="flex items-center justify-between gap-4 rounded-lg border-b px-2 py-3 transition-colors last:border-0 hover:bg-muted/50"
							>
								<div>
									<p className="font-medium">{sale.formattedSaleNumber}</p>
									<p className="text-xs text-muted-foreground">
										{new Intl.DateTimeFormat("es-PE", {
											timeZone: summary.timezone,
											timeStyle: "short",
										}).format(sale.createdAt)}
									</p>
								</div>
								<span className="font-semibold tabular-nums">{formatMoney(sale.totalCents)}</span>
							</Link>
						))
					)}
				</CardContent>
				<CardFooter className="border-t">
					<SalesLink date={summary.date}>Ver todas las ventas</SalesLink>
				</CardFooter>
			</Card>
		</div>
	);
}

export function CloseChecklist({ checklist }: { checklist: DailyCloseChecklist }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Comprobaciones de cierre</CardTitle>
				<CardDescription>
					Guía de solo lectura. El cierre financiero se realiza en Caja.
				</CardDescription>
				<CardAction>
					<Badge
						variant={
							checklist.status === "fail"
								? "destructive"
								: checklist.status === "warning"
									? "secondary"
									: "outline"
						}
					>
						{checklist.status === "pass"
							? "Todo listo"
							: checklist.status === "warning"
								? "Pendiente"
								: "Requiere atención"}
					</Badge>
				</CardAction>
			</CardHeader>
			<CardContent className="grid gap-3 md:grid-cols-2">
				{checklist.items.map((item) => (
					<div key={item.id} className="flex gap-3 rounded-xl border p-4">
						<HugeiconsIcon
							icon={item.status === "pass" ? CheckmarkCircleIcon : Alert02Icon}
							className={cn(
								"mt-0.5 size-5 shrink-0",
								item.status === "fail"
									? "text-destructive"
									: item.status === "warning"
										? "text-amber-600"
										: "text-emerald-600",
							)}
						/>
						<div className="min-w-0">
							<p className="font-medium">{item.title}</p>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{item.description}
							</p>
							{item.action === "cash" && (
								<Link
									to="/cash"
									search={{ tab: "current", panel: null, sessionId: null, page: 1, pageSize: 25 }}
									className="mt-2 inline-block text-xs font-medium text-primary underline"
								>
									Ir a caja
								</Link>
							)}
							{item.action === "sale" && (
								<Link
									to="/sale"
									search={{ q: "", categoryId: null, panel: "cart", saleId: null }}
									className="mt-2 inline-block text-xs font-medium text-primary underline"
								>
									Ir a venta
								</Link>
							)}
							{item.action === "diagnostics" && (
								<Link
									to="/settings"
									className="mt-2 inline-block text-xs font-medium text-primary underline"
								>
									Ejecutar diagnóstico
								</Link>
							)}
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

function SalesLink({ date, children }: { date: string; children: React.ReactNode }) {
	return (
		<Link
			to="/sales"
			search={{
				q: "",
				status: "all",
				paymentMethod: "all",
				range: "custom",
				from: date,
				to: date,
				cashSessionId: null,
				page: 1,
				pageSize: 25,
				sort: "newest",
				panel: null,
				saleId: null,
			}}
			className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
		>
			{children}
		</Link>
	);
}

function InventoryLink({
	status,
	children,
}: {
	status: "low_stock" | "out_of_stock";
	children: React.ReactNode;
}) {
	return (
		<Link
			to="/inventory"
			search={{
				tab: "stock",
				q: "",
				productStatus: "active",
				stockStatus: status,
				categoryId: null,
				movementType: "all",
				page: 1,
				pageSize: 25,
				sort: "name-asc",
				panel: null,
				productId: null,
			}}
			className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
		>
			{children}
		</Link>
	);
}
