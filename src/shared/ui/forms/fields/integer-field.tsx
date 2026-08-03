import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import type { ComponentProps } from "react";
import { useFieldContext } from "../form-context";
import { FieldErrorInfo } from "./field-error-info";

interface IntegerFieldProps
	extends Omit<ComponentProps<typeof Input>, "name" | "value" | "onBlur" | "onChange" | "type"> {
	label: string;
	description?: string;
	minimum?: number;
	maximum?: number;
}

export function IntegerField({
	label,
	description,
	minimum = 0,
	maximum,
	id,
	...props
}: IntegerFieldProps) {
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
				inputMode="numeric"
				pattern="[0-9]*"
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => {
					const next = event.target.value;
					if (next === "" || /^\d+$/.test(next)) field.handleChange(next);
				}}
				aria-invalid={isInvalid}
				aria-valuemin={minimum}
				aria-valuemax={maximum}
				{...props}
			/>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldErrorInfo />
		</Field>
	);
}
