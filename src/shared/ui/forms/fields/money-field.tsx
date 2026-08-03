import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/shared/components/ui/input-group";
import type { ComponentProps } from "react";
import { useFieldContext } from "../form-context";
import { FieldErrorInfo } from "./field-error-info";

interface MoneyFieldProps
	extends Omit<ComponentProps<typeof InputGroupInput>, "name" | "value" | "onBlur" | "onChange"> {
	label: string;
	description?: string;
}

export function MoneyField({ label, description, id, ...props }: MoneyFieldProps) {
	const field = useFieldContext<string>();
	const inputId = id ?? `field-${field.name}`;
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
			<InputGroup>
				<InputGroupAddon>
					<InputGroupText>S/</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput
					id={inputId}
					name={field.name}
					value={field.state.value}
					onBlur={field.handleBlur}
					onChange={(event) => field.handleChange(event.target.value)}
					inputMode="decimal"
					aria-invalid={isInvalid}
					{...props}
				/>
			</InputGroup>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldErrorInfo />
		</Field>
	);
}
