import type { AnyFormApi } from "@tanstack/react-form";
import { isCashError } from "../../domain";

export function setCashFieldError(form: AnyFormApi, error: unknown): boolean {
	if (!isCashError(error) || !error.field) return false;
	form.setFieldMeta(error.field, (meta) => ({
		...meta,
		isTouched: true,
		errorMap: { ...meta.errorMap, onSubmit: error.message },
	}));
	return true;
}

export function cashFormErrorMessage(error: unknown): string {
	return isCashError(error) ? error.message : "Ocurrió un error inesperado al guardar.";
}
