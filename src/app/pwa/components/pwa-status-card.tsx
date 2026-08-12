import { Badge } from "@/shared/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { usePwa } from "../pwa-context";

export function PwaStatusCard() {
	const pwa = usePwa();
	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<div>
						<CardTitle>Aplicación</CardTitle>
						<CardDescription>Estado de Bodegix POS en este navegador.</CardDescription>
					</div>
					<Badge variant={pwa.serviceWorker.offlineReady ? "secondary" : "outline"}>
						{pwa.serviceWorker.offlineReady ? "Lista offline" : "Requiere primera carga"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<dl className="grid gap-3 text-sm sm:grid-cols-2">
					<Status label="Producto" value="Bodegix POS" />
					<Status label="Versión instalada" value={pwa.version} />
					<Status label="Build" value={pwa.build.commitSha.slice(0, 7)} />
					<Status
						label="Compilado"
						value={new Date(pwa.build.buildTimestamp).toLocaleString("es-PE")}
					/>
					<Status
						label="Estado offline"
						value={pwa.browserOnline ? "Con conexión" : "Sin conexión"}
					/>
					<Status
						label="Service Worker"
						value={
							pwa.serviceWorker.registrationError
								? "Error de registro"
								: pwa.serviceWorker.controlling
									? "Activo y controlando"
									: pwa.serviceWorker.registered
										? "Registrado"
										: pwa.supported
											? "Inicializando"
											: "No compatible"
						}
					/>
				</dl>
				{pwa.serviceWorker.registrationError && (
					<p className="mt-4 text-sm text-destructive">
						El modo offline de la aplicación no pudo inicializarse. Tus datos locales no se han
						modificado.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function Status({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="font-medium">{value}</dd>
		</div>
	);
}
