import type { BackupFile } from "../../model";

export type SaveBackupFileResult =
	| { status: "saved"; strategy: "file_picker" }
	| { status: "saved"; strategy: "download" }
	| { status: "cancelled" };

export interface BackupFileGateway {
	save(file: BackupFile): Promise<SaveBackupFileResult>;
	open(): Promise<File | null>;
}
