import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import type { ComponentProps } from "react";
import { useFieldContext } from "../form-context";
import { FieldErrorInfo } from "./field-error-info";

export interface TextFieldProps
	extends Omit<ComponentProps<typeof Input>, "name" | "value" | "onBlur" | "onChange"> {
	label: string;
	description?: string;
}

export function TextField({ label, description, id, ...props }: TextFieldProps) {
	const field = useFieldContext<string>();
	const inputId = id ?? `field-${field.name}`;
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
			<Input
				id={inputId}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				aria-invalid={isInvalid}
				aria-describedby={description ? `${inputId}-description` : undefined}
				{...props}
			/>
			{description && (
				<FieldDescription id={`${inputId}-description`}>{description}</FieldDescription>
			)}
			<FieldErrorInfo />
		</Field>
	);
}
