import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { LocalStorageStatusCard } from "@/modules/settings";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { CreateBackupResult } from "../../model";
import { getBackupReminderStatus, type BackupReminderStatus } from "../../model";
import { createBackupServices } from "../../infrastructure";
import type { CurrentInstallationPreview } from "../../application";
import { formatBackupDate } from "../backup-ui.helpers";
import { CreateBackupOverlay } from "../components/create-backup-overlay";
import { RestoreBackupSheet } from "../components/restore-backup-sheet";
import type { SettingsSearch } from "../settings-search";

const REMINDER_LABELS: Record<BackupReminderStatus, string> = {
	never: "Sin respaldo",
	up_to_date: "Al día",
	due_soon: "Próximo",
	overdue: "Atrasado",
};

export function BackupSettingsPage() {
	const search = useSearch({ from: "/settings" });
	const navigate = useNavigate({ from: "/settings" });
	const [preview, setPreview] = useState<CurrentInstallationPreview | null>(null);
	const [loadError, setLoadError] = useState(false);

	const loadPreview = useCallback(async () => {
		try {
			setPreview(await createBackupServices().database.getCurrentPreview());
			setLoadError(false);
		} catch {
			setLoadError(true);
		}
	}, []);

	useEffect(() => {
		void loadPreview();
	}, [loadPreview]);

	function updateSearch(next: Partial<SettingsSearch>) {
		void navigate({ search: (current) => ({ ...current, ...next }), replace: true });
	}

	const reminder = preview
		? getBackupReminderStatus({
				lastBackupAt: preview.settings.lastBackupAt,
				backupReminderDays: preview.settings.backupReminderDays,
				now: Date.now(),
				timezone: preview.settings.timezone,
			})
		: null;

	return (
		<AppShell pageTitle="Configuración">
			<PageHeader
				title="Configuración"
				description="Administra la instalación, el almacenamiento y la portabilidad de tus datos"
				badge={<Badge variant="secondary">Fase 8</Badge>}
			/>
			<div className="px-4 pb-8 md:px-6">
				<Tabs
					value={search.section}
					onValueChange={(value) =>
						updateSearch({ section: value as SettingsSearch["section"], panel: null })
					}
					className="gap-5"
				>
					<TabsList variant="line" className="max-w-full overflow-x-auto">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="storage">Almacenamiento</TabsTrigger>
						<TabsTrigger value="data">Datos y respaldos</TabsTrigger>
					</TabsList>
					<TabsContent value="general">
						<Card>
							<CardHeader>
								<CardTitle>Instalación local</CardTitle>
								<CardDescription>
									La identidad comercial, moneda y zona horaria se conservan dentro del respaldo.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-3 text-sm sm:grid-cols-2">
								<Detail label="Negocio" value={preview?.settings.businessName ?? "Cargando…"} />
								<Detail label="Zona horaria" value={preview?.settings.timezone ?? "Cargando…"} />
								<Detail label="Moneda" value={preview?.settings.currency ?? "Cargando…"} />
								<Detail label="Esquema" value="7" />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="storage">
						<LocalStorageStatusCard />
					</TabsContent>
					<TabsContent value="data">
						<div className="grid gap-4 lg:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle>Respaldo manual</CardTitle>
									<CardDescription>
										Crea un archivo portable con todas las tablas de esta instalación.
									</CardDescription>
									{reminder && (
										<CardAction>
											<Badge
												variant={
													reminder === "overdue" || reminder === "never" ? "destructive" : "outline"
												}
											>
												{REMINDER_LABELS[reminder]}
											</Badge>
										</CardAction>
									)}
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<div className="grid gap-3 text-sm sm:grid-cols-2">
										<Detail
											label="Último respaldo"
											value={formatBackupDate(preview?.settings.lastBackupAt ?? null)}
										/>
										<Detail
											label="Recordatorio"
											value={`Cada ${preview?.settings.backupReminderDays ?? "—"} días`}
										/>
										<Detail label="Productos" value={String(preview?.productCount ?? "—")} />
										<Detail label="Ventas" value={String(preview?.saleCount ?? "—")} />
									</div>
									<Button type="button" onClick={() => updateSearch({ panel: "backup" })}>
										Crear respaldo
									</Button>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Restaurar datos</CardTitle>
									<CardDescription>
										Valida un archivo y reemplaza de forma controlada la base local.
									</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<p className="text-sm text-muted-foreground">
										Bodegix crea primero una copia de seguridad de los datos actuales. No combina
										información.
									</p>
									<Button
										type="button"
										variant="destructive"
										onClick={() => updateSearch({ panel: "restore" })}
									>
										Restaurar desde archivo
									</Button>
								</CardContent>
							</Card>
						</div>
						{loadError && (
							<p className="mt-4 text-sm text-destructive">
								No se pudo leer el estado de los respaldos.
							</p>
						)}
					</TabsContent>
				</Tabs>
			</div>
			<CreateBackupOverlay
				open={search.panel === "backup"}
				onOpenChange={(open) => updateSearch({ section: "data", panel: open ? "backup" : null })}
				onSaved={(_result: CreateBackupResult) => void loadPreview()}
				preview={preview}
			/>
			<RestoreBackupSheet
				open={search.panel === "restore"}
				onOpenChange={(open) => updateSearch({ section: "data", panel: open ? "restore" : null })}
			/>
		</AppShell>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="font-medium">{value}</dd>
		</div>
	);
}
