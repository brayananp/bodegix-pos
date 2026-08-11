import { describe, expect, it } from "vitest";
import {
	isRestoreConfirmationComplete,
	restoreConfirmationDefaults,
} from "./restore-confirmation-form.options";

describe("confirmación de restauración", () => {
	it("empieza sin consentimientos preaceptados", () => {
		expect(restoreConfirmationDefaults).toEqual({
			replaceCurrentData: false,
			acceptWarnings: false,
			confirmSafetyDownload: false,
			confirmationText: "",
		});
	});

	it("exige únicamente los consentimientos aplicables al respaldo", () => {
		const confirmed = {
			replaceCurrentData: true,
			acceptWarnings: false,
			confirmSafetyDownload: true,
			confirmationText: "RESTAURAR",
		};

		expect(
			isRestoreConfirmationComplete(confirmed, {
				requireWarningAcceptance: false,
				requireDownloadConfirmation: true,
			}),
		).toBe(true);
		expect(
			isRestoreConfirmationComplete(confirmed, {
				requireWarningAcceptance: true,
				requireDownloadConfirmation: true,
			}),
		).toBe(false);
	});

	it("rechaza texto o aceptación de reemplazo incompletos", () => {
		const requirements = {
			requireWarningAcceptance: false,
			requireDownloadConfirmation: false,
		};

		expect(
			isRestoreConfirmationComplete(
				{ ...restoreConfirmationDefaults, replaceCurrentData: true },
				requirements,
			),
		).toBe(false);
		expect(
			isRestoreConfirmationComplete(
				{ ...restoreConfirmationDefaults, confirmationText: "RESTAURAR" },
				requirements,
			),
		).toBe(false);
	});
});
