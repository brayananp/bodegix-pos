import { useFormContext } from "../form-context";

export function DirtyStateIndicator() {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(state) => state.isDirty}>
			{(isDirty) =>
				isDirty ? <span className="text-xs text-muted-foreground">Cambios sin guardar</span> : null
			}
		</form.Subscribe>
	);
}
