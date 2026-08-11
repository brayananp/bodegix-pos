import { z } from "zod";

export const settingsSearchSchema = z.object({
	section: z.enum(["general", "storage", "data"]).catch("general"),
	panel: z.enum(["backup", "restore"]).nullable().catch(null),
});

export type SettingsSearch = z.infer<typeof settingsSearchSchema>;
