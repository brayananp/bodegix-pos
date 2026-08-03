import { AppHeader } from "@/app/layout/app-header";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cash")({
	component: CashPage,
});

function CashPage() {
	return (
		<AppShell>
			<AppHeader title="Caja" description="Gestión de caja" />
			<PageHeader
				title="Caja"
				description="Apertura, movimientos y cierre de caja diaria"
				badge={
					<Badge variant="outline" className="text-xs">
						Fase 0
					</Badge>
				}
			/>
			<div className="p-4 md:p-6">
				<div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
					<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl font-bold">
						C
					</div>
					<div>
						<h2 className="font-semibold text-foreground">Caja</h2>
						<p className="text-sm text-muted-foreground mt-1 max-w-sm">
							Aquí se gestionará la apertura de caja, depósitos, retiros y el cierre con cuadre de
							efectivo.
						</p>
					</div>
					<Badge variant="secondary">Fase 3+ — Pendiente de implementación</Badge>
				</div>
			</div>
		</AppShell>
	);
}
