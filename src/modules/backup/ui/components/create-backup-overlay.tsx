import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/shared/components/ui/drawer";
import { Progress, ProgressLabel, ProgressValue } from "@/shared/components/ui/progress";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { createBackup, saveCreatedBackup } from "../../application";
import type { CurrentInstallationPreview } from "../../application";
import { createBackupServices } from "../../infrastructure";
import type { BackupProgress, CreateBackupResult } from "../../model";
import { backupErrorMessage, formatFileSize } from "../backup-ui.helpers";

interface CreateBackupOverlayProps {
	open: boolean;
	onOpenChange(open: boolean): void;
	onSaved(result: CreateBackupResult): void;
	preview: CurrentInstallationPreview | null;
}

export function CreateBackupOverlay({
	open,
	onOpenChange,
	onSaved,
	preview,
}: CreateBackupOverlayProps) {
	const isMobile = useIsMobile();
	const [progress, setProgress] = useState<BackupProgress | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<CreateBackupResult | null>(null);
	const pending = progress !== null && progress.phase !== "completed";

	async function handleCreate() {
		setError(null);
		setResult(null);
		const services = createBackupServices();
		try {
			const artifact = await createBackup(services, { source: "manual", onProgress: setProgress });
			const saved = await saveCreatedBackup(
				artifact,
				services.file,
				services.database,
				setProgress,
			);
			if (saved.status === "cancelled") {
				setProgress(null);
				return;
			}
			setResult(artifact.result);
			onSaved(artifact.result);
		} catch (caught) {
			setError(backupErrorMessage(caught));
			setProgress(null);
		}
	}

	function handleOpenChange(next: boolean) {
		if (pending) return;
		if (!next) {
			setError(null);
			setProgress(null);
			setResult(null);
		}
		onOpenChange(next);
	}

	const content = (
		<>
			<div className="flex flex-col gap-4 overflow-y-auto px-4 py-5 md:px-6">
				<p className="text-sm text-muted-foreground">
					El archivo incluye catálogo, inventario, ventas, pagos, caja, configuración y borradores.
					Guárdalo fuera de este dispositivo.
				</p>
				{preview?.openCashSession && (
					<Alert>
						<AlertTitle>Hay una caja abierta</AlertTitle>
						<AlertDescription>
							El respaldo la incluirá y podrá restaurarse en ese mismo estado.
						</AlertDescription>
					</Alert>
				)}
				{Boolean(preview?.saleDraftItemCount) && (
					<Alert>
						<AlertTitle>Hay una venta pendiente</AlertTitle>
						<AlertDescription>
							El carrito con {preview?.saleDraftItemCount} ítems también se incluirá.
						</AlertDescription>
					</Alert>
				)}
				{progress && (
					<Progress value={progress.percentage}>
						<ProgressLabel>
							{progress.phase === "saving" ? "Guardando archivo" : "Preparando respaldo"}
						</ProgressLabel>
						<ProgressValue />
					</Progress>
				)}
				{result && (
					<Alert>
						<AlertTitle>Respaldo guardado</AlertTitle>
						<AlertDescription>
							{result.fileName} · {formatFileSize(result.fileSizeBytes)} · {result.rowCount}{" "}
							registros
						</AlertDescription>
					</Alert>
				)}
				{error && (
					<Alert variant="destructive">
						<AlertTitle>No se pudo crear el respaldo</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</div>
			<div className="flex flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end md:px-6">
				<Button
					type="button"
					variant="outline"
					onClick={() => handleOpenChange(false)}
					disabled={pending}
				>
					{result ? "Cerrar" : "Cancelar"}
				</Button>
				{!result && (
					<Button type="button" onClick={() => void handleCreate()} disabled={pending}>
						{pending ? "Creando respaldo…" : "Crear y guardar respaldo"}
					</Button>
				)}
			</div>
		</>
	);

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={handleOpenChange}>
				<DrawerContent className="max-h-[92dvh]">
					<DrawerHeader className="text-left">
						<DrawerTitle>Crear respaldo</DrawerTitle>
						<DrawerDescription>
							Genera una copia portable de todos los datos locales.
						</DrawerDescription>
					</DrawerHeader>
					{content}
					<DrawerFooter className="hidden" />
				</DrawerContent>
			</Drawer>
		);
	}
	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={!pending} className="gap-0 p-0 sm:max-w-xl">
				<DialogHeader className="border-b px-6 py-5">
					<DialogTitle>Crear respaldo</DialogTitle>
					<DialogDescription>
						Genera una copia portable de todos los datos locales.
					</DialogDescription>
				</DialogHeader>
				{content}
				<DialogFooter className="hidden" />
			</DialogContent>
		</Dialog>
	);
}
