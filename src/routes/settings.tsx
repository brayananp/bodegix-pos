import { BackupSettingsPage, settingsSearchSchema } from "@/modules/backup";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
	validateSearch: settingsSearchSchema,
	component: BackupSettingsPage,
});
