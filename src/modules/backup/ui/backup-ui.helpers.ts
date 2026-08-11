import { isBackupError, type BackupErrorCode } from "../model";

const ERROR_MESSAGES: Record<BackupErrorCode, string> = {
	BACKUP_EXPORT_FAILED: "No se pudo crear el respaldo.",
	BACKUP_SAVE_CANCELLED: "No se guardó el archivo.",
	BACKUP_SAVE_FAILED: "El navegador no pudo guardar el archivo.",
	BACKUP_FILE_TOO_LARGE: "El archivo supera el límite de 128 MiB.",
	BACKUP_FILE_INVALID: "El archivo no es un respaldo válido de Bodegix.",
	BACKUP_MAGIC_INVALID: "La firma del archivo no corresponde a Bodegix.",
	BACKUP_MANIFEST_INVALID: "El manifiesto del respaldo es inválido.",
	BACKUP_MANIFEST_TOO_LARGE: "El manifiesto supera el límite permitido.",
	BACKUP_MANIFEST_CHECKSUM_MISMATCH: "La información de control fue alterada.",
	BACKUP_CHECKSUM_MISMATCH: "El contenido del respaldo fue alterado o está dañado.",
	BACKUP_FILE_TRUNCATED: "El archivo está incompleto o contiene datos adicionales.",
	BACKUP_FORMAT_UNSUPPORTED: "Esta versión del formato no es compatible.",
	BACKUP_DATABASE_NAME_INVALID: "El respaldo pertenece a otra base de datos.",
	BACKUP_SCHEMA_INCOMPATIBLE: "La estructura del respaldo no es compatible.",
	BACKUP_SCHEMA_MIGRATION_UNAVAILABLE: "No existe una migración explícita para este respaldo.",
	BACKUP_CREATED_BY_NEWER_APP: "El respaldo fue creado por una versión más reciente.",
	BACKUP_TABLE_MISSING: "Falta una tabla obligatoria en el respaldo.",
	BACKUP_TABLE_UNEXPECTED: "El respaldo contiene una tabla inesperada.",
	BACKUP_TABLE_SCHEMA_MISMATCH: "La estructura de una tabla no coincide.",
	BACKUP_ROW_COUNT_MISMATCH: "La cantidad de registros no coincide.",
	BACKUP_VALIDATION_FAILED: "La validación profunda encontró inconsistencias.",
	BACKUP_SAFETY_COPY_REQUIRED: "Primero debes guardar la copia de seguridad previa.",
	BACKUP_MAINTENANCE_LOCK_FAILED: "No se pudo reservar la base de datos para restaurar.",
	BACKUP_OTHER_TABS_ACTIVE: "Cierra las otras pestañas de Bodegix antes de restaurar.",
	BACKUP_RESTORE_FAILED: "La restauración no pudo completarse.",
	BACKUP_POST_RESTORE_VALIDATION_FAILED:
		"La restauración falló la validación y se recuperaron los datos anteriores.",
	BACKUP_RECOVERY_FAILED: "La restauración y la recuperación automática fallaron.",
	BACKUP_CRYPTO_UNAVAILABLE: "El navegador no ofrece la verificación criptográfica necesaria.",
};

export function backupErrorMessage(error: unknown): string {
	return isBackupError(error) ? ERROR_MESSAGES[error.code] : "Ocurrió un error inesperado.";
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
}

export function formatBackupDate(value: number | null): string {
	if (value === null) return "Nunca";
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(value);
}
