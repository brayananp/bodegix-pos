import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/shared/components/ui/progress";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import { useAppForm } from "@/shared/ui/forms";
import { useBlocker } from "@tanstack/react-router";
import {
	createBackup,
	inspectBackup,
	restoreBackup,
	saveCreatedBackup,
	type CreatedBackupArtifact,
	type InspectBackupResult,
	type CurrentInstallationPreview,
} from "../../application";
import { createBackupServices } from "../../infrastructure";
import type { RestoreBackupResult, RestoreProgress } from "../../model";
import { backupErrorMessage, formatBackupDate, formatFileSize } from "../backup-ui.helpers";
import { RestoreConfirmationFields } from "../forms/restore-confirmation-fields";
import {
	isRestoreConfirmationComplete,
	restoreConfirmationFormOptions,
} from "../forms/restore-confirmation-form.options";

type RestoreStage = "select" | "preview" | "safety" | "confirm" | "restoring" | "result";

interface RestoreBackupSheetProps {
	open: boolean;
	onOpenChange(open: boolean): void;
}

export function RestoreBackupSheet({ open, onOpenChange }: RestoreBackupSheetProps) {
	const [stage, setStage] = useState<RestoreStage>("select");
	const [inspected, setInspected] = useState<InspectBackupResult | null>(null);
	const [currentPreview, setCurrentPreview] = useState<CurrentInstallationPreview | null>(null);
	const [safetyBackup, setSafetyBackup] = useState<CreatedBackupArtifact | null>(null);
	const [requiresDownloadConfirmation, setRequiresDownloadConfirmation] = useState(false);
	const [progress, setProgress] = useState<RestoreProgress | null>(null);
	const [result, setResult] = useState<RestoreBackupResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const locked = stage === "restoring";
	useBlocker({ shouldBlockFn: () => locked, enableBeforeUnload: locked });

	const form = useAppForm({
		...restoreConfirmationFormOptions,
		onSubmit: async ({ value }) => {
			if (!inspected || !safetyBackup) return;
			if (
				!isRestoreConfirmationComplete(value, {
					requireWarningAcceptance: inspected.validation.warnings.length > 0,
					requireDownloadConfirmation: requiresDownloadConfirmation,
				})
			) {
				setError("Completa todas las confirmaciones obligatorias antes de restaurar.");
				return;
			}
			setError(null);
			setStage("restoring");
			const services = createBackupServices();
			try {
				const restored = await restoreBackup(
					{ inspected, safetyBackup, onProgress: setProgress },
					services,
				);
				setResult(restored);
				setStage("result");
			} catch (caught) {
				setError(backupErrorMessage(caught));
				setStage("confirm");
			}
		},
	});

	function reset() {
		setStage("select");
		setInspected(null);
		setCurrentPreview(null);
		setSafetyBackup(null);
		setRequiresDownloadConfirmation(false);
		setProgress(null);
		setResult(null);
		setError(null);
		form.reset();
	}

	function handleOpenChange(next: boolean) {
		if (locked) return;
		if (!next) reset();
		onOpenChange(next);
	}

	async function selectAndInspect() {
		setError(null);
		const services = createBackupServices();
		try {
			const file = await services.file.open();
			if (!file) return;
			setProgress({ phase: "reading_file", completedRows: 0, totalRows: 0, percentage: null });
			const [checked, current] = await Promise.all([
				inspectBackup(file, services, setProgress),
				services.database.getCurrentPreview(),
			]);
			setInspected(checked);
			setCurrentPreview(current);
			setProgress(null);
			setStage("preview");
		} catch (caught) {
			setError(backupErrorMessage(caught));
			setProgress(null);
		}
	}

	async function createSafetyBackup() {
		setError(null);
		const services = createBackupServices();
		try {
			setProgress({
				phase: "creating_safety_backup",
				completedRows: 0,
				totalRows: 0,
				percentage: null,
			});
			const artifact = await createBackup(services, { source: "pre_restore" });
			const saved = await saveCreatedBackup(artifact, services.file, services.database);
			if (saved.status === "cancelled") {
				setProgress(null);
				return;
			}
			setSafetyBackup(artifact);
			setRequiresDownloadConfirmation(saved.strategy === "download");
			form.reset({
				replaceCurrentData: false,
				acceptWarnings: !inspected?.validation.warnings.length,
				confirmSafetyDownload: saved.strategy !== "download",
				confirmationText: "",
			});
			setProgress(null);
			setStage("confirm");
		} catch (caught) {
			setError(backupErrorMessage(caught));
			setProgress(null);
		}
	}

	const manifest = inspected?.container.manifest;
	const totalRows = manifest?.tables.reduce((sum, table) => sum + table.rowCount, 0) ?? 0;

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent
				showCloseButton={!locked}
				className="w-full gap-0 sm:max-w-[820px]"
				aria-describedby="restore-description"
			>
				<SheetHeader className="border-b px-5 py-5 md:px-6">
					<SheetTitle>Restaurar respaldo</SheetTitle>
					<SheetDescription id="restore-description">
						Valida el archivo en una base temporal antes de reemplazar los datos actuales.
					</SheetDescription>
				</SheetHeader>
				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-6">
					<div className="flex flex-col gap-5">
						<RestoreSteps stage={stage} />
						{stage === "select" && (
							<div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
								<p className="font-medium">Selecciona un archivo .bodegix</p>
								<p className="text-sm text-muted-foreground">
									Se comprobarán formato, integridad, versión, tablas y relaciones sin tocar tus
									datos.
								</p>
								<Button type="button" onClick={() => void selectAndInspect()}>
									Seleccionar y validar archivo
								</Button>
							</div>
						)}
						{manifest && (stage === "preview" || stage === "safety") && (
							<>
								<div className="grid gap-4 lg:grid-cols-2">
									<div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
										<p className="font-medium sm:col-span-2">Respaldo seleccionado</p>
										<Detail label="Negocio" value={manifest.installation.businessName} />
										<Detail label="Creado" value={formatBackupDate(manifest.createdAt)} />
										<Detail
											label="Versión de esquema"
											value={String(manifest.database.schemaVersion)}
										/>
										<Detail
											label="Contenido"
											value={`${manifest.tables.length} tablas · ${totalRows} registros`}
										/>
										<Detail
											label="Tamaño útil"
											value={formatFileSize(manifest.payload.byteLength)}
										/>
										<Detail
											label="Validación"
											value={
												inspected.validation.status === "valid"
													? "Válido"
													: "Válido con advertencias"
											}
										/>
									</div>
									<div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
										<p className="font-medium sm:col-span-2">Instalación actual</p>
										<Detail label="Negocio" value={currentPreview?.settings.businessName ?? "—"} />
										<Detail label="Productos" value={String(currentPreview?.productCount ?? "—")} />
										<Detail label="Ventas" value={String(currentPreview?.saleCount ?? "—")} />
										<Detail
											label="Caja"
											value={currentPreview?.openCashSession ? "Abierta" : "Sin sesión abierta"}
										/>
									</div>
								</div>
								{inspected.validation.warnings.map((warning) => (
									<Alert key={`${warning.code}-${warning.message}`}>
										<AlertTitle>Advertencia</AlertTitle>
										<AlertDescription>{warning.message}</AlertDescription>
									</Alert>
								))}
								<Alert>
									<AlertTitle>Copia previa obligatoria</AlertTitle>
									<AlertDescription>
										Antes de continuar se guardará un respaldo de esta instalación para
										recuperación.
									</AlertDescription>
								</Alert>
								<div className="flex flex-wrap gap-2">
									<Button type="button" variant="outline" onClick={reset}>
										Elegir otro archivo
									</Button>
									<Button type="button" onClick={() => void createSafetyBackup()}>
										Guardar copia previa y continuar
									</Button>
								</div>
							</>
						)}
						{stage === "confirm" && inspected && safetyBackup && (
							<form
								className="flex flex-col gap-5"
								onSubmit={(event) => {
									event.preventDefault();
									void form.handleSubmit();
								}}
							>
								<form.AppForm>
									<Alert variant="destructive">
										<AlertTitle>Reemplazo total e irreversible</AlertTitle>
										<AlertDescription>
											Se eliminará el contenido actual y se importarán {totalRows} registros del
											respaldo.
										</AlertDescription>
									</Alert>
									<RestoreConfirmationFields
										form={form}
										requireWarningAcceptance={inspected.validation.warnings.length > 0}
										requireDownloadConfirmation={requiresDownloadConfirmation}
									/>
									<form.FormError message={error} />
									<div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
										<Button type="button" variant="outline" onClick={() => setStage("preview")}>
											Volver
										</Button>
										<form.Subscribe
											selector={(state) => ({
												isSubmitting: state.isSubmitting,
												values: state.values,
											})}
										>
											{({ isSubmitting, values }) => (
												<Button
													type="submit"
													variant="destructive"
													disabled={
														isSubmitting ||
														!isRestoreConfirmationComplete(values, {
															requireWarningAcceptance: inspected.validation.warnings.length > 0,
															requireDownloadConfirmation: requiresDownloadConfirmation,
														})
													}
												>
													{isSubmitting ? "Restaurando…" : "Restaurar y reemplazar datos"}
												</Button>
											)}
										</form.Subscribe>
									</div>
								</form.AppForm>
							</form>
						)}
						{stage === "restoring" && (
							<div className="flex flex-col gap-4 rounded-xl border p-5">
								<p className="font-medium">No cierres esta pestaña</p>
								<p className="text-sm text-muted-foreground">
									Las operaciones están bloqueadas mientras se restaura y verifica la base local.
								</p>
								<Progress value={progress?.percentage ?? null}>
									<ProgressLabel>Restaurando datos</ProgressLabel>
									<ProgressValue />
								</Progress>
							</div>
						)}
						{stage === "result" && result && (
							<div className="flex flex-col gap-5">
								<Alert>
									<AlertTitle>Restauración completada y verificada</AlertTitle>
									<AlertDescription>
										{result.businessName} · {result.tableCount} tablas · {result.rowCount} registros
									</AlertDescription>
								</Alert>
								<Button type="button" onClick={() => window.location.assign("/summary")}>
									Reiniciar Bodegix y revisar resumen
								</Button>
							</div>
						)}
						{error && stage !== "confirm" && (
							<Alert variant="destructive">
								<AlertTitle>No se pudo continuar</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}

function RestoreSteps({ stage }: { stage: RestoreStage }) {
	const active =
		stage === "select"
			? 1
			: stage === "preview" || stage === "safety"
				? 2
				: stage === "confirm"
					? 3
					: 4;
	return (
		<nav className="flex flex-wrap gap-2" aria-label={`Paso ${active} de 4`}>
			{["Archivo", "Validación", "Confirmación", "Resultado"].map((label, index) => (
				<Badge key={label} variant={active === index + 1 ? "default" : "outline"}>
					{index + 1}. {label}
				</Badge>
			))}
		</nav>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="font-medium">{value}</p>
		</div>
	);
}
