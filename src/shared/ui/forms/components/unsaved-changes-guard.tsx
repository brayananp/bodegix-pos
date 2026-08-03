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
import { useBlocker } from "@tanstack/react-router";
import { useFormContext } from "../form-context";

function NavigationGuard({ shouldBlock }: { shouldBlock: boolean }) {
	const blocker = useBlocker({
		shouldBlockFn: () => shouldBlock,
		enableBeforeUnload: shouldBlock,
		withResolver: true,
	});
	return (
		<AlertDialog
			open={blocker.status === "blocked"}
			onOpenChange={(open) => {
				if (!open && blocker.status === "blocked") blocker.reset?.();
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
					<AlertDialogDescription>
						Hay información sin guardar. Si sales ahora, perderás esos cambios.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={blocker.reset}>Seguir editando</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={blocker.proceed}>
						Descartar cambios
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function UnsavedChangesGuard() {
	const form = useFormContext();
	return (
		<form.Subscribe
			selector={(state) => ({ isDirty: state.isDirty, isSubmitting: state.isSubmitting })}
		>
			{({ isDirty, isSubmitting }) => <NavigationGuard shouldBlock={isDirty && !isSubmitting} />}
		</form.Subscribe>
	);
}
