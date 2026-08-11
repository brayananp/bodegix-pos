import { formOptions } from "@tanstack/react-form";
import { z } from "zod";

export const restoreConfirmationSchema = z.object({
	replaceCurrentData: z.boolean().refine(Boolean, "Debes aceptar el reemplazo total."),
	acceptWarnings: z.boolean(),
	confirmSafetyDownload: z.boolean(),
	confirmationText: z
		.string()
		.refine((value): boolean => value === "RESTAURAR", "Escribe RESTAURAR exactamente."),
});

export type RestoreConfirmationValues = z.infer<typeof restoreConfirmationSchema>;

interface RestoreConfirmationRequirements {
	requireWarningAcceptance: boolean;
	requireDownloadConfirmation: boolean;
}

export function isRestoreConfirmationComplete(
	values: RestoreConfirmationValues,
	requirements: RestoreConfirmationRequirements,
): boolean {
	return (
		values.replaceCurrentData &&
		(!requirements.requireWarningAcceptance || values.acceptWarnings) &&
		(!requirements.requireDownloadConfirmation || values.confirmSafetyDownload) &&
		values.confirmationText === "RESTAURAR"
	);
}

export const restoreConfirmationDefaults: RestoreConfirmationValues = {
	replaceCurrentData: false,
	acceptWarnings: false,
	confirmSafetyDownload: false,
	confirmationText: "",
};

export const restoreConfirmationFormOptions = formOptions({
	defaultValues: restoreConfirmationDefaults,
	validators: {
		onChange: restoreConfirmationSchema,
		onSubmit: restoreConfirmationSchema,
	},
});
