import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

export interface ActiveStateTarget {
	kind: "product" | "category";
	id: string;
	name: string;
	isActive: boolean;
}

export function CatalogActiveStateDialog({
	target,
	onClose,
	onConfirm,
	isSubmitting = false,
}: {
	target: ActiveStateTarget | null;
	onClose(): void;
	onConfirm(): void;
	isSubmitting?: boolean;
}) {
	const isDeactivation = target?.isActive ?? false;
	return (
		<AlertDialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isDeactivation ? "¿Desactivar registro?" : "¿Reactivar registro?"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isDeactivation
							? `${target?.name ?? "Este registro"} dejará de estar disponible para nuevas operaciones, pero conservará su historial.`
							: `${target?.name ?? "Este registro"} volverá a estar disponible en el catálogo.`}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant={isDeactivation ? "destructive" : "default"}
						onClick={onConfirm}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Guardando…" : isDeactivation ? "Desactivar" : "Reactivar"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
