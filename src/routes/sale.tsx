import { AppHeader } from "@/app/layout/app-header";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sale")({
	component: SalePage,
});

function SalePage() {
	return (
		<AppShell>
			<AppHeader title="Venta" description="Registra una venta" />
			<PageHeader
				title="Punto de Venta"
				description="Registra productos y cobra al cliente"
				badge={
					<Badge variant="outline" className="text-xs">
						Fase 0
					</Badge>
				}
			/>
			<div className="p-4 md:p-6">
				<PlaceholderContent
					title="Venta"
					description="Aquí se implementará el carrito de compras, búsqueda de productos y cobro al cliente."
					phase="Fase 2"
				/>
			</div>
		</AppShell>
	);
}

function PlaceholderContent({
	title,
	description,
	phase,
}: {
	title: string;
	description: string;
	phase: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
			<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl font-bold">
				{title.charAt(0)}
			</div>
			<div>
				<h2 className="font-semibold text-foreground">{title}</h2>
				<p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
			</div>
			<Badge variant="secondary">{phase} — Pendiente de implementación</Badge>
		</div>
	);
}
