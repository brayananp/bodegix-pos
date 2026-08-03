import type { TextFieldProps } from "./text-field";
import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { useFieldContext } from "../form-context";
import { FieldErrorInfo } from "./field-error-info";

export function BarcodeField({ label, description, id, ...props }: TextFieldProps) {
	const field = useFieldContext<string>();
	const inputId = id ?? `field-${field.name}`;
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
			<Input
				id={inputId}
				name={field.name}
				type="text"
				inputMode="text"
				value={field.state.value}
				onChange={(event) => field.handleChange(event.target.value)}
				onBlur={() => {
					field.handleChange(field.state.value.trim());
					field.handleBlur();
				}}
				aria-invalid={isInvalid}
				{...props}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldErrorInfo />
		</Field>
	);
}
