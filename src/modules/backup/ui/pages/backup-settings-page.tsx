import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { PwaInstallCard, PwaStatusCard, PwaUpdateCard } from "@/app/pwa";
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
import type { CurrentInstallationPreview } from "../../application";
import { createBackupServices } from "../../infrastructure";
import type { CreateBackupResult } from "../../model";
import { type BackupReminderStatus, getBackupReminderStatus } from "../../model";
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
	const [demoSeedStatus, setDemoSeedStatus] = useState<"idle" | "loading" | "success" | "error">(
		"idle",
	);
	const [demoSeedMessage, setDemoSeedMessage] = useState<string | null>(null);

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

	async function loadDemoSeed() {
		if (!import.meta.env.DEV || demoSeedStatus === "loading") return;
		setDemoSeedStatus("loading");
		setDemoSeedMessage(null);
		try {
			const { seedDemoDatabase } = await import("@/dev/demo-data/demo-database-seed");
			const result = await seedDemoDatabase();
			setDemoSeedStatus("success");
			setDemoSeedMessage(
				`${result.products} productos, ${result.sales} ventas y ${result.cashSessions} cajas cargadas. Diagnóstico: ${result.diagnostics}.`,
			);
			await loadPreview();
		} catch (error) {
			setDemoSeedStatus("error");
			setDemoSeedMessage(
				error instanceof Error ? error.message : "No se pudieron cargar los datos demo.",
			);
		}
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
				badge={<Badge variant="secondary">Fase 11</Badge>}
			/>
			<div className="px-4 pb-8 md:px-6">
				<Tabs
					value={search.section}
					onValueChange={(value) =>
						updateSearch({ section: value as SettingsSearch["section"], panel: null })
					}
					className="gap-5"
				>
					<TabsList className="grid h-auto! w-full max-w-xl grid-cols-2 p-1 min-[360px]:grid-cols-3">
						<TabsTrigger value="general" className="h-9 min-w-0 px-1 text-xs sm:px-2 sm:text-sm">
							General
						</TabsTrigger>
						<TabsTrigger value="storage" className="h-9 min-w-0 px-1 text-xs sm:px-2 sm:text-sm">
							Almacenamiento
						</TabsTrigger>
						<TabsTrigger
							value="data"
							className="col-span-2 h-9 min-w-0 px-1 text-xs min-[360px]:col-span-1 sm:px-2 sm:text-sm"
						>
							Datos y respaldos
						</TabsTrigger>
					</TabsList>
					<TabsContent value="general">
						<div className="grid gap-4 lg:grid-cols-2">
							<PwaStatusCard />
							<PwaInstallCard />
							<PwaUpdateCard />
							<Card className="lg:col-span-2">
								<CardHeader>
									<CardTitle>Instalación local</CardTitle>
									<CardDescription>
										La identidad comercial, moneda y zona horaria se conservan dentro del respaldo.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<dl className="grid gap-3 text-sm sm:grid-cols-2">
										<Detail label="Negocio" value={preview?.settings.businessName ?? "Cargando…"} />
										<Detail
											label="Zona horaria"
											value={preview?.settings.timezone ?? "Cargando…"}
										/>
										<Detail label="Moneda" value={preview?.settings.currency ?? "Cargando…"} />
										<Detail label="Esquema" value="7" />
									</dl>
								</CardContent>
							</Card>
						</div>
					</TabsContent>
					<TabsContent value="storage">
						<LocalStorageStatusCard />
					</TabsContent>
					<TabsContent value="data">
						<div className="grid gap-4 lg:grid-cols-2">
							{import.meta.env.DEV && (
								<Card className="border-dashed lg:col-span-2">
									<CardHeader>
										<CardTitle>Datos de demostración</CardTitle>
										<CardDescription>
											Disponible solo en desarrollo. Carga escenarios coherentes para revisar toda
											la aplicación y se niega a sobrescribir una base ocupada.
										</CardDescription>
										<CardAction>
											<Badge variant="outline">DEV</Badge>
										</CardAction>
									</CardHeader>
									<CardContent className="flex flex-col gap-3">
										<Button
											type="button"
											variant="outline"
											disabled={demoSeedStatus === "loading" || (preview?.productCount ?? 0) > 0}
											onClick={() => void loadDemoSeed()}
										>
											{demoSeedStatus === "loading" ? "Cargando datos…" : "Cargar datos demo"}
										</Button>
										{demoSeedMessage && (
											<p
												className={
													demoSeedStatus === "error"
														? "text-sm text-destructive"
														: "text-sm text-muted-foreground"
												}
											>
												{demoSeedMessage}
											</p>
										)}
									</CardContent>
								</Card>
							)}
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
									<dl className="grid gap-3 text-sm sm:grid-cols-2">
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
									</dl>
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
