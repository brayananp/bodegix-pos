import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cash")({
	component: CashPage,
});

function CashPage() {
	return (
		<AppShell pageTitle="Caja">
			<PageHeader
				title="Caja"
				description="Apertura, movimientos y cierre de caja diaria"
				badge={<Badge variant="secondary">Fase 3</Badge>}
			/>
			<div className="px-4 md:px-6">
				<div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
					<div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-bold">
						C
					</div>
					<div className="space-y-1.5">
						<h2 className="text-base font-semibold">Caja</h2>
						<p className="text-sm text-muted-foreground max-w-xs mx-auto">
							Apertura, depósitos, retiros y cierre con cuadre de efectivo.
						</p>
					</div>
					<Badge variant="outline">Fase 3+ — Pendiente de implementación</Badge>
				</div>
			</div>
		</AppShell>
	);
}
