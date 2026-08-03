import { describe, expect, it } from "vitest";
import {
	appSettingsRecordSchema,
	paymentMethodSchema,
	paymentStatusSchema,
	persistedNonNegativeIntegerSchema,
	persistedTimestampSchema,
} from ".";

const validSettings = {
	id: "main",
	installationId: "installation-1",
	setupCompleted: false,
	businessName: "Mi bodega",
	currency: "PEN",
	timezone: "America/Lima",
	nextSaleNumber: 1,
	backupReminderDays: 7,
	lastBackupAt: null,
	createdAt: 1,
	updatedAt: 1,
} as const;

describe("registros persistidos", () => {
	it("acepta una configuración válida", () => {
		expect(appSettingsRecordSchema.safeParse(validSettings).success).toBe(true);
	});

	it("rechaza una configuración inválida", () => {
		expect(appSettingsRecordSchema.safeParse({ ...validSettings, nextSaleNumber: 0 }).success).toBe(
			false,
		);
		expect(
			appSettingsRecordSchema.safeParse({ ...validSettings, backupReminderDays: 366 }).success,
		).toBe(false);
	});

	it("rechaza dinero decimal", () => {
		expect(persistedNonNegativeIntegerSchema.safeParse(10.5).success).toBe(false);
	});

	it("rechaza timestamps inválidos", () => {
		expect(persistedTimestampSchema.safeParse(0).success).toBe(false);
		expect(persistedTimestampSchema.safeParse(1.5).success).toBe(false);
	});

	it("rechaza un método de pago desconocido", () => {
		expect(paymentMethodSchema.safeParse("mixed").success).toBe(false);
	});

	it("rechaza un estado de pago desconocido", () => {
		expect(paymentStatusSchema.safeParse("pending").success).toBe(false);
	});
});
