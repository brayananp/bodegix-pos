/**
 * Módulo: backup
 *
 * Responsabilidad: exportación, validación y restauración de datos.
 * - Exportar toda la BD a JSON con checksum
 * - Validar estructura antes de restaurar
 * - Restaurar desde archivo JSON
 * - Diagnóstico de la base de datos local
 *
 * @module backup
 */

export const BACKUP_MODULE = "backup" as const;

export type BackupModuleId = typeof BACKUP_MODULE;

export { BackupSettingsPage } from "./ui/pages/backup-settings-page";
export { settingsSearchSchema, type SettingsSearch } from "./ui/settings-search";
export { getBackupReminderStatus, type BackupReminderStatus } from "./model";
