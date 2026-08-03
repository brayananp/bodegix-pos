import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { useFieldContext } from "../form-context";
import { FieldErrorInfo } from "./field-error-info";

export interface SelectFieldOption {
	value: string;
	label: string;
}

interface SelectFieldProps {
	label: string;
	description?: string;
	placeholder?: string;
	emptyLabel?: string;
	options: SelectFieldOption[];
	disabled?: boolean;
}

export function SelectField({
	label,
	description,
	placeholder = "Seleccionar",
	emptyLabel = "Sin categoría",
	options,
	disabled,
}: SelectFieldProps) {
	const field = useFieldContext<string>();
	const inputId = `field-${field.name}`;
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	const items = [{ value: null, label: emptyLabel }, ...options];
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
			<Select
				items={items}
				value={field.state.value || null}
				onValueChange={(value) => field.handleChange(value ?? "")}
				disabled={disabled}
			>
				<SelectTrigger id={inputId} className="w-full" aria-invalid={isInvalid}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value={null}>{emptyLabel}</SelectItem>
						{options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldErrorInfo />
		</Field>
	);
}
