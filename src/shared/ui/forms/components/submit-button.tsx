import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/spinner";
import type { ComponentProps } from "react";
import { useFormContext } from "../form-context";

interface SubmitButtonProps extends Omit<ComponentProps<typeof Button>, "type" | "disabled"> {
	label: string;
	submittingLabel?: string;
	forceDisabled?: boolean;
}

export function SubmitButton({
	label,
	submittingLabel = "Guardando…",
	forceDisabled = false,
	...props
}: SubmitButtonProps) {
	const form = useFormContext();
	return (
		<form.Subscribe
			selector={(state) => ({
				canSubmit: state.canSubmit,
				isSubmitting: state.isSubmitting,
			})}
		>
			{({ canSubmit, isSubmitting }) => (
				<Button type="submit" disabled={forceDisabled || !canSubmit || isSubmitting} {...props}>
					{isSubmitting && <Spinner data-icon="inline-start" aria-hidden="true" />}
					{isSubmitting ? submittingLabel : label}
				</Button>
			)}
		</form.Subscribe>
	);
}
