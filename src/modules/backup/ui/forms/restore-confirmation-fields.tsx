import { FieldGroup } from "@/shared/components/ui/field";
import { withForm } from "@/shared/ui/forms";
import { restoreConfirmationFormOptions } from "./restore-confirmation-form.options";

export const RestoreConfirmationFields = withForm({
	...restoreConfirmationFormOptions,
	props: {
		requireWarningAcceptance: false,
		requireDownloadConfirmation: false,
	},
	render: function RestoreConfirmationFieldsRender({
		form,
		requireWarningAcceptance,
		requireDownloadConfirmation,
	}) {
		return (
			<FieldGroup className="gap-4">
				<form.AppField name="replaceCurrentData">
					{(field) => (
						<field.CheckboxField
							label="Entiendo que se reemplazarán todos los datos actuales"
							description="No se combinarán ventas, productos ni movimientos."
						/>
					)}
				</form.AppField>
				{requireWarningAcceptance && (
					<form.AppField name="acceptWarnings">
						{(field) => (
							<field.CheckboxField label="Revisé y acepto las advertencias del respaldo" />
						)}
					</form.AppField>
				)}
				{requireDownloadConfirmation && (
					<form.AppField name="confirmSafetyDownload">
						{(field) => (
							<field.CheckboxField
								label="Confirmo que el respaldo previo terminó de descargarse"
								description="Consérvalo hasta verificar que la restauración quedó correcta."
							/>
						)}
					</form.AppField>
				)}
				<form.AppField name="confirmationText">
					{(field) => (
						<field.TextField
							label="Escribe RESTAURAR para confirmar"
							autoComplete="off"
							spellCheck={false}
						/>
					)}
				</form.AppField>
			</FieldGroup>
		);
	},
});
