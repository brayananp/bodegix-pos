import { Button } from "@/shared/components/ui/button";
import { SubmitButton } from "./submit-button";

interface FormActionsProps {
	onCancel(): void;
	submitLabel: string;
	submittingLabel?: string;
	cancelLabel?: string;
}

export function FormActions({
	onCancel,
	submitLabel,
	submittingLabel,
	cancelLabel = "Cancelar",
}: FormActionsProps) {
	return (
		<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button type="button" variant="outline" onClick={onCancel}>
				{cancelLabel}
			</Button>
			<SubmitButton label={submitLabel} {...(submittingLabel ? { submittingLabel } : {})} />
		</div>
	);
}
