import { createFormHook } from "@tanstack/react-form";
import { DirtyStateIndicator } from "./components/dirty-state-indicator";
import { FormActions } from "./components/form-actions";
import { FormError } from "./components/form-error";
import { SubmitButton } from "./components/submit-button";
import { UnsavedChangesGuard } from "./components/unsaved-changes-guard";
import { BarcodeField } from "./fields/barcode-field";
import { FieldErrorInfo } from "./fields/field-error-info";
import { IntegerField } from "./fields/integer-field";
import { MoneyField } from "./fields/money-field";
import { SelectField } from "./fields/select-field";
import { TextField } from "./fields/text-field";
import { fieldContext, formContext } from "./form-context";

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		MoneyField,
		IntegerField,
		BarcodeField,
		SelectField,
		FieldErrorInfo,
	},
	formComponents: {
		SubmitButton,
		FormActions,
		FormError,
		DirtyStateIndicator,
		UnsavedChangesGuard,
	},
});
