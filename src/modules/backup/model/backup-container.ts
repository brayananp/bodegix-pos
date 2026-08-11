import type { BodegixBackupManifestV1 } from "./backup-manifest";

export const BACKUP_FORMAT_NAME = "bodegix-backup" as const;
export const BACKUP_FORMAT_VERSION = 1 as const;
export const BACKUP_FILE_EXTENSION = ".bodegix" as const;
export const BACKUP_MIME_TYPE = "application/octet-stream" as const;
export const BACKUP_MAGIC_HEADER = "BODEGIX_BACKUP_V1" as const;
export const MAX_BACKUP_FILE_SIZE_BYTES = 128 * 1024 * 1024;
export const MAX_BACKUP_MANIFEST_SIZE_BYTES = 256 * 1024;

export interface ParsedBackupContainer {
	readonly manifest: BodegixBackupManifestV1;
	readonly payload: Blob;
}

export interface BackupFile {
	readonly name: string;
	readonly blob: Blob;
	readonly manifest: BodegixBackupManifestV1;
}
