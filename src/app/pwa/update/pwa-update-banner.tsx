import { Button } from "@/shared/components/ui/button";
import { usePwa } from "../pwa-context";

const BLOCKER_MESSAGES = {
	dirty_form: "Termina o descarta los cambios antes de actualizar.",
	checkout_in_progress: "Completa la operación actual antes de actualizar.",
	database_maintenance: "Espera a que termine el mantenimiento de datos.",
	restore_in_progress: "La restauración debe terminar antes de actualizar.",
	critical_operation: "Completa la operación crítica antes de actualizar.",
} as const;

export function PwaUpdateBanner() {
	const pwa = usePwa();
	if (!pwa.serviceWorker.updateAvailable || pwa.updatePostponed) return null;
	const blocker = pwa.updateSafety.blockers[0];
	return (
		<section
			className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[80] mx-auto max-w-xl rounded-xl border bg-popover p-4 shadow-xl md:bottom-4"
			aria-labelledby="pwa-update-title"
			aria-live="polite"
		>
			<h2 id="pwa-update-title" className="font-semibold">
				Nueva versión disponible
			</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				Bodegix tiene una actualización preparada.
			</p>
			{blocker && (
				<p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
					{BLOCKER_MESSAGES[blocker]}
				</p>
			)}
			<div className="mt-4 flex flex-wrap justify-end gap-2">
				<Button type="button" variant="outline" onClick={pwa.postponeUpdate}>
					Más tarde
				</Button>
				<Button
					type="button"
					disabled={!pwa.updateSafety.safeToReload || pwa.updateState === "applying"}
					onClick={() => void pwa.applyUpdate()}
				>
					{pwa.updateState === "applying" ? "Actualizando…" : "Actualizar ahora"}
				</Button>
			</div>
		</section>
	);
}
