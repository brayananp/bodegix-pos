import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { usePwa } from "../pwa-context";

export function PwaUpdateCard() {
	const pwa = usePwa();
	const unavailableOffline = !pwa.browserOnline;
	return (
		<Card>
			<CardHeader>
				<CardTitle>Actualizaciones</CardTitle>
				<CardDescription>La aplicación nunca se recarga sin una acción explícita.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<p>
					Estado:{" "}
					<span className="font-medium">
						{pwa.serviceWorker.updateAvailable
							? "Nueva versión disponible"
							: pwa.updateState === "checking"
								? "Buscando…"
								: pwa.updateState === "error"
									? "No se pudo comprobar"
									: "Al día"}
					</span>
				</p>
				{pwa.serviceWorker.updateAvailable && !pwa.updateSafety.safeToReload && (
					<p className="text-amber-700 dark:text-amber-300">
						Actualización bloqueada mientras hay cambios u operaciones críticas activas.
					</p>
				)}
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={
							unavailableOffline || pwa.updateState === "checking" || !pwa.serviceWorker.registered
						}
						onClick={() => void pwa.checkForUpdate()}
					>
						Buscar actualización
					</Button>
					{pwa.serviceWorker.updateAvailable && (
						<Button
							type="button"
							disabled={!pwa.updateSafety.safeToReload || pwa.updateState === "applying"}
							onClick={() => void pwa.applyUpdate()}
						>
							Actualizar ahora
						</Button>
					)}
				</div>
				{unavailableOffline && (
					<p className="text-xs text-muted-foreground">Conéctate para buscar versiones nuevas.</p>
				)}
			</CardContent>
		</Card>
	);
}
