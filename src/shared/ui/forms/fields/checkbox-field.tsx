import { Checkbox } from "@/shared/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import { useFieldContext } from "../form-context";
import { FieldErrorInfo } from "./field-error-info";

interface CheckboxFieldProps {
	label: string;
	description?: string;
	id?: string;
	disabled?: boolean;
}

export function CheckboxField({ label, description, id, disabled }: CheckboxFieldProps) {
	const field = useFieldContext<boolean>();
	const inputId = id ?? `field-${field.name}`;
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid} orientation="horizontal">
			<Checkbox
				id={inputId}
				checked={field.state.value}
				onCheckedChange={(checked) => field.handleChange(checked === true)}
				onBlur={field.handleBlur}
				disabled={disabled}
				aria-invalid={isInvalid}
			/>
			<div className="space-y-1">
				<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
				{description && <FieldDescription>{description}</FieldDescription>}
				<FieldErrorInfo />
			</div>
		</Field>
	);
}
