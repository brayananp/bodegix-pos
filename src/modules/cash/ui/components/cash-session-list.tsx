import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatMoney } from "@/shared/kernel/money";
import type { CashSessionSearchResult } from "../../application";
import { formatCashDate, formatSignedMoney } from "../cash-format";

export function CashSessionList({
	result,
	onView,
	onPageChange,
}: {
	result: CashSessionSearchResult | undefined;
	onView(id: string): void;
	onPageChange(page: number): void;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Historial de sesiones</CardTitle>
			</CardHeader>
			<CardContent>
				{!result ? (
					<p className="py-8 text-sm text-muted-foreground">Cargando historial…</p>
				) : result.items.length === 0 ? (
					<div className="rounded-xl border border-dashed px-4 py-10 text-center">
						<p className="font-medium">Todavía no hay cierres de caja</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Las sesiones cerradas conservarán aquí su arqueo definitivo.
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{result.items.map((session) => (
							<button
								type="button"
								key={session.id}
								onClick={() => onView(session.id)}
								className="flex min-h-16 w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-medium">{formatCashDate(session.openedAt)}</span>
										<Badge variant={session.status === "open" ? "secondary" : "outline"}>
											{session.status === "open" ? "Abierta" : "Cerrada"}
										</Badge>
									</div>
									<p className="mt-1 text-xs text-muted-foreground">
										Inicial {formatMoney(session.openingCashCents)}
										{session.closedAt ? ` · Cerrada ${formatCashDate(session.closedAt)}` : ""}
									</p>
								</div>
								<div className="shrink-0 text-right">
									<p className="font-heading font-semibold tabular-nums">
										{session.expectedCashCents === null
											? "—"
											: formatMoney(session.expectedCashCents)}
									</p>
									<p className="text-xs text-muted-foreground">
										{session.differenceCents === null
											? "Sin cierre"
											: formatSignedMoney(session.differenceCents)}
									</p>
								</div>
							</button>
						))}
						{result.totalPages > 1 && (
							<div className="flex items-center justify-between pt-3">
								<span className="text-xs text-muted-foreground">
									Página {result.page} de {result.totalPages}
								</span>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={result.page <= 1}
										onClick={() => onPageChange(result.page - 1)}
									>
										Anterior
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={result.page >= result.totalPages}
										onClick={() => onPageChange(result.page + 1)}
									>
										Siguiente
									</Button>
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
