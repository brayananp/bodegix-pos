import { Button } from "@/shared/components/ui/button";
import { SubmitButton } from "./submit-button";

interface FormActionsProps {
	onCancel(): void;
	submitLabel: string;
	submittingLabel?: string;
	cancelLabel?: string;
	submitDisabled?: boolean;
}

export function FormActions({
	onCancel,
	submitLabel,
	submittingLabel,
	cancelLabel = "Cancelar",
	submitDisabled = false,
}: FormActionsProps) {
	return (
		<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button type="button" variant="outline" onClick={onCancel}>
				{cancelLabel}
			</Button>
			<SubmitButton
				label={submitLabel}
				forceDisabled={submitDisabled}
				{...(submittingLabel ? { submittingLabel } : {})}
			/>
		</div>
	);
}
