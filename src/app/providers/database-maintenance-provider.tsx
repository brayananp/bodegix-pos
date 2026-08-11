import { useSyncExternalStore } from "react";
import { Spinner } from "@/shared/components/ui/spinner";
import { getDatabaseMaintenanceCoordinator } from "@/shared/infrastructure/database-maintenance";

export function useDatabaseMaintenance() {
	const coordinator = getDatabaseMaintenanceCoordinator();
	return useSyncExternalStore(
		coordinator.subscribe,
		coordinator.getSnapshot,
		coordinator.getSnapshot,
	);
}

export function DatabaseMaintenanceProvider({ children }: { children: React.ReactNode }) {
	const maintenance = useDatabaseMaintenance();
	return (
		<>
			{children}
			{maintenance.remote && maintenance.state.state !== "idle" && (
				<div
					className="fixed inset-0 flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm"
					role="dialog"
					aria-modal="true"
					aria-labelledby="database-maintenance-title"
				>
					<div className="flex max-w-md flex-col items-center gap-4 text-center">
						<Spinner className="size-8" />
						<h1 id="database-maintenance-title" className="font-heading text-2xl font-semibold">
							Bodegix está protegiendo tus datos
						</h1>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Otra pestaña está restaurando un respaldo. Los formularios permanecen abiertos, pero
							las escrituras están bloqueadas hasta que termine.
						</p>
					</div>
				</div>
			)}
		</>
	);
}
