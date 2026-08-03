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
import type { CashMovementSearchResult } from "../../application";
import type { CashSessionSummary } from "../../domain";
import { formatCashDate } from "../cash-format";
import { CashDifferenceDisplay } from "../components/cash-difference-display";
import { CashMovementList } from "../components/cash-movement-list";
import { CashClosingBreakdown, CashPaymentBreakdown } from "../components/cash-summary";

export function CashSessionDetailSheet({
	summary,
	movements,
	onClose,
}: {
	summary: CashSessionSummary | null | undefined;
	movements: CashMovementSearchResult | null | undefined;
	onClose(): void;
}) {
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
				className="h-dvh w-full max-w-none gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[680px]"
			>
				<SheetHeader className="shrink-0 border-b pr-4 md:px-6">
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="flex items-center gap-2">
								<SheetTitle>Detalle de sesión</SheetTitle>
								{summary && (
									<Badge variant={summary.status === "open" ? "secondary" : "outline"}>
										{summary.status === "open" ? "Abierta" : "Cerrada"}
									</Badge>
								)}
							</div>
							<SheetDescription>
								{summary
									? `Apertura ${formatCashDate(summary.openedAt)}`
									: "Consulta el arqueo histórico inmutable."}
							</SheetDescription>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							Cerrar
						</Button>
					</div>
				</SheetHeader>
				<div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
					{summary === undefined ? (
						<p className="text-sm text-muted-foreground">Cargando sesión…</p>
					) : summary === null ? (
						<Alert>
							<AlertTitle>Sesión no disponible</AlertTitle>
							<AlertDescription>
								La sesión solicitada no existe o ya no está disponible en este dispositivo.
							</AlertDescription>
						</Alert>
					) : (
						<div className="space-y-4">
							{!summary.snapshotAvailable && summary.status === "closed" && (
								<Alert>
									<AlertTitle>Desglose histórico no disponible</AlertTitle>
									<AlertDescription>
										Esta sesión proviene de una versión anterior. Se conservan los importes de
										cierre originales sin recalcularlos.
									</AlertDescription>
								</Alert>
							)}
							<CashClosingBreakdown summary={summary} />
							{summary.snapshotAvailable && <CashPaymentBreakdown summary={summary} />}
							<div className="grid grid-cols-2 gap-3 rounded-xl border p-4 text-sm">
								<div>
									<p className="text-muted-foreground">Efectivo contado</p>
									<p className="mt-1 font-semibold tabular-nums">
										{summary.countedCashCents === null
											? "—"
											: formatMoney(summary.countedCashCents)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Cierre</p>
									<p className="mt-1 font-semibold">
										{summary.closedAt ? formatCashDate(summary.closedAt) : "En curso"}
									</p>
								</div>
							</div>
							{summary.differenceCents !== null && (
								<CashDifferenceDisplay differenceCents={summary.differenceCents} />
							)}
							<CashMovementList result={movements} />
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
