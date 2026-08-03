import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<AppShell pageTitle="Configuración">
			<PageHeader
				title="Configuración"
				description="Ajusta los datos y preferencias de tu bodega"
				badge={<Badge variant="secondary">Fase 5</Badge>}
			/>
			<div className="px-4 md:px-6">
				<div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
					<div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-bold">
						⚙
					</div>
					<div className="space-y-1.5">
						<h2 className="text-base font-semibold">Configuración</h2>
						<p className="text-sm text-muted-foreground max-w-xs mx-auto">
							Nombre de la bodega, zona horaria, moneda y preferencias.
						</p>
					</div>
					<Badge variant="outline">Fase 5+ — Pendiente de implementación</Badge>
				</div>
			</div>
		</AppShell>
	);
}
