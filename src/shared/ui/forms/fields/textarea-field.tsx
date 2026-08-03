import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import { Textarea } from "@/shared/components/ui/textarea";
import type { ComponentProps } from "react";
import { useFieldContext } from "../form-context";
import { FieldErrorInfo } from "./field-error-info";

interface TextareaFieldProps
	extends Omit<ComponentProps<typeof Textarea>, "name" | "value" | "onBlur" | "onChange"> {
	label: string;
	description?: string;
}

export function TextareaField({ label, description, id, ...props }: TextareaFieldProps) {
	const field = useFieldContext<string>();
	const inputId = id ?? `field-${field.name}`;
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
			<Textarea
				id={inputId}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				aria-invalid={isInvalid}
				{...props}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldErrorInfo />
		</Field>
	);
}
