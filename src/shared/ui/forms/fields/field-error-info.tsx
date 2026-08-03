import { FieldError } from "@/shared/components/ui/field";
import { useFieldContext } from "../form-context";

function errorMessage(error: unknown): string | undefined {
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		const message = error.message;
		return typeof message === "string" ? message : undefined;
	}
	return undefined;
}

export function FieldErrorInfo() {
	const field = useFieldContext<unknown>();
	const errors = field.state.meta.errors
		.map((error) => errorMessage(error))
		.filter((message): message is string => Boolean(message))
		.map((message) => ({ message }));
	return <FieldError id={`${field.name}-error`} errors={errors} aria-live="polite" />;
}
