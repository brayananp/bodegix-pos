import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import type { StorageManagerAdapter } from "@/shared/infrastructure/local-db";
import { useLocalStorageStatus } from "../hooks/use-local-storage-status";

function formatBytes(bytes: number | null): string {
	if (bytes === null) return "No disponible";
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const unit = units[unitIndex] ?? "B";
	return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${unit}`;
}

function maskInstallationId(value: string): string {
	if (value.length <= 12) return `${value.slice(0, 4)}…`;
	return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export function LocalStorageStatusCard({
	storageAdapter,
}: {
	storageAdapter?: StorageManagerAdapter;
}) {
	const {
		status,
		storage,
		diagnostics,
		storagePending,
		diagnosticPending,
		requestPersistence,
		rerunDiagnostics,
	} = useLocalStorageStatus(storageAdapter);

	if (status.state !== "ready") return null;
	const { result } = status;

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<CardTitle>Almacenamiento local</CardTitle>
						<CardDescription>
							Estado técnico de IndexedDB y estimaciones provistas por el navegador.
						</CardDescription>
					</div>
					<Badge variant="secondary">Base lista</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<dl className="grid gap-3 text-sm sm:grid-cols-2">
					<StatusRow label="Base" value={result.databaseName} />
					<StatusRow label="Versión del esquema" value={String(result.schemaVersion)} />
					<div>
						<dt className="text-muted-foreground">Instalación</dt>
						<dd
							className="font-mono"
							data-testid="installation-id"
							data-installation-id={result.installationId}
						>
							{maskInstallationId(result.installationId)}
						</dd>
					</div>
					<StatusRow
						label="Persistencia"
						value={
							storagePending
								? "Consultando…"
								: !storage?.supported
									? "API no disponible"
									: storage.persisted === true
										? "Concedida"
										: "No concedida"
						}
					/>
					<StatusRow label="Uso estimado" value={formatBytes(storage?.usageBytes ?? null)} />
					<StatusRow label="Cuota estimada" value={formatBytes(storage?.quotaBytes ?? null)} />
					<StatusRow
						label="Porcentaje aproximado"
						value={
							storage?.usagePercentage === null || storage?.usagePercentage === undefined
								? "No disponible"
								: `${storage.usagePercentage.toFixed(1)} %`
						}
					/>
				</dl>

				<div className="rounded-lg border p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-medium">Diagnóstico {diagnostics?.mode ?? "basic"}</p>
							<p className="text-xs text-muted-foreground">
								{diagnostics?.checks.length ?? 0} comprobaciones de solo lectura
							</p>
						</div>
						<Badge variant={diagnostics?.status === "fail" ? "destructive" : "outline"}>
							{diagnostics?.status === "pass"
								? "Aprobado"
								: diagnostics?.status === "warning"
									? "Con advertencias"
									: "Con fallos"}
						</Badge>
					</div>
				</div>

				<p className="text-xs text-muted-foreground">
					La cuota es una estimación. La persistencia reduce el riesgo de expulsión automática, pero
					no sustituye un respaldo.
				</p>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => void requestPersistence()}
						disabled={storagePending || !storage?.persistenceSupported}
					>
						Solicitar persistencia
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => void rerunDiagnostics()}
						disabled={diagnosticPending}
					>
						{diagnosticPending ? "Comprobando…" : "Ejecutar diagnóstico profundo"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function StatusRow({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="font-medium">{value}</dd>
		</div>
	);
}
