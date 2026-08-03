import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/inventory")({
	component: InventoryPage,
});

function InventoryPage() {
	return (
		<AppShell pageTitle="Inventario">
			<PageHeader
				title="Inventario"
				description="Control de stock y movimientos de inventario"
				badge={<Badge variant="secondary">Fase 1</Badge>}
			/>
			<div className="px-4 md:px-6">
				<div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
					<div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-bold">
						I
					</div>
					<div className="space-y-1.5">
						<h2 className="text-base font-semibold">Inventario</h2>
						<p className="text-sm text-muted-foreground max-w-xs mx-auto">
							Movimientos de stock, entradas, ajustes y alertas de stock bajo.
						</p>
					</div>
					<Badge variant="outline">Fase 1+ — Pendiente de implementación</Badge>
				</div>
			</div>
		</AppShell>
	);
}
