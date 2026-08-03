import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sale")({
	component: SalePage,
});

function SalePage() {
	return (
		<AppShell pageTitle="Venta">
			<PageHeader
				title="Punto de Venta"
				description="Registra productos y cobra al cliente"
				badge={<Badge variant="secondary">Fase 2</Badge>}
			/>
			<div className="px-4 md:px-6">
				<PlaceholderCard
					letter="V"
					title="Módulo de ventas"
					description="Aquí se implementará el carrito de compras, búsqueda rápida de productos y el flujo completo de cobro."
					phase="Fase 2"
				/>
			</div>
		</AppShell>
	);
}

function PlaceholderCard({
	letter,
	title,
	description,
	phase,
}: {
	letter: string;
	title: string;
	description: string;
	phase: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
			<div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-bold">
				{letter}
			</div>
			<div className="space-y-1.5">
				<h2 className="text-base font-semibold text-foreground">{title}</h2>
				<p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
			</div>
			<Badge variant="outline">{phase} — Pendiente de implementación</Badge>
		</div>
	);
}
