import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { LocalStorageStatusCard } from "@/modules/settings";
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
			<div className="px-4 pb-8 md:px-6">
				<LocalStorageStatusCard />
			</div>
		</AppShell>
	);
}
