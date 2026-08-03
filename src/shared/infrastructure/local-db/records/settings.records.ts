import { z } from "zod";
import {
	persistedIdSchema,
	persistedPositiveIntegerSchema,
	persistedTimestampSchema,
} from "./persistence.schemas";

export const appSettingsRecordSchema = z
	.object({
		id: z.literal("main"),
		installationId: persistedIdSchema,
		setupCompleted: z.boolean(),
		businessName: z.string().trim().min(1),
		currency: z.literal("PEN"),
		timezone: z.literal("America/Lima"),
		nextSaleNumber: persistedPositiveIntegerSchema,
		backupReminderDays: persistedPositiveIntegerSchema.max(365),
		lastBackupAt: persistedTimestampSchema.nullable(),
		createdAt: persistedTimestampSchema,
		updatedAt: persistedTimestampSchema,
	})
	.refine(({ createdAt, updatedAt }) => updatedAt >= createdAt, {
		message: "updatedAt debe ser posterior o igual a createdAt",
		path: ["updatedAt"],
	});

export type AppSettingsRecord = z.infer<typeof appSettingsRecordSchema>;
