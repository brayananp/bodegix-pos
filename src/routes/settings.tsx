import { settingsSearchSchema } from "@/modules/backup/ui/settings-search";
import { BackupSettingsPage } from "@/modules/backup/ui/pages/backup-settings-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
	validateSearch: settingsSearchSchema,
	component: BackupSettingsPage,
});
