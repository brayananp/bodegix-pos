import type { BackupFileGateway, SaveBackupFileResult } from "../application";
import { BACKUP_FILE_EXTENSION, BACKUP_MIME_TYPE, BackupError, type BackupFile } from "../model";

interface FileSystemWritableLike {
	write(data: Blob): Promise<void>;
	close(): Promise<void>;
}

interface FileSystemFileHandleLike {
	createWritable(): Promise<FileSystemWritableLike>;
	getFile(): Promise<File>;
}

interface FilePickerWindow extends Window {
	showSaveFilePicker?: (options: unknown) => Promise<FileSystemFileHandleLike>;
	showOpenFilePicker?: (options: unknown) => Promise<FileSystemFileHandleLike[]>;
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError";
}

const pickerOptions = {
	types: [
		{
			description: "Respaldo de Bodegix",
			accept: { [BACKUP_MIME_TYPE]: [BACKUP_FILE_EXTENSION] },
		},
	],
	excludeAcceptAllOption: true,
};

export class BrowserBackupFileGateway implements BackupFileGateway {
	constructor(private readonly browserWindow: FilePickerWindow = window as FilePickerWindow) {}

	async save(file: BackupFile): Promise<SaveBackupFileResult> {
		try {
			if (this.browserWindow.showSaveFilePicker) {
				const handle = await this.browserWindow.showSaveFilePicker({
					...pickerOptions,
					suggestedName: file.name,
				});
				const writable = await handle.createWritable();
				await writable.write(file.blob);
				await writable.close();
				return { status: "saved", strategy: "file_picker" };
			}
			const url = URL.createObjectURL(file.blob);
			try {
				const anchor = this.browserWindow.document.createElement("a");
				anchor.href = url;
				anchor.download = file.name;
				anchor.hidden = true;
				this.browserWindow.document.body.append(anchor);
				anchor.click();
				anchor.remove();
			} finally {
				URL.revokeObjectURL(url);
			}
			return { status: "saved", strategy: "download" };
		} catch (error) {
			if (isAbortError(error)) return { status: "cancelled" };
			throw new BackupError("BACKUP_SAVE_FAILED", error);
		}
	}

	async open(): Promise<File | null> {
		try {
			if (this.browserWindow.showOpenFilePicker) {
				const handles = await this.browserWindow.showOpenFilePicker({
					...pickerOptions,
					multiple: false,
				});
				if (handles.length !== 1) throw new BackupError("BACKUP_FILE_INVALID");
				return handles[0]?.getFile() ?? null;
			}
			return await new Promise<File | null>((resolve) => {
				const input = this.browserWindow.document.createElement("input");
				let settled = false;
				const finish = (selected: File | null) => {
					if (settled) return;
					settled = true;
					input.remove();
					resolve(selected);
				};
				input.type = "file";
				input.accept = `${BACKUP_FILE_EXTENSION},${BACKUP_MIME_TYPE}`;
				input.multiple = false;
				input.hidden = true;
				input.addEventListener(
					"change",
					() => {
						const files = input.files;
						finish(files?.length === 1 ? (files.item(0) ?? null) : null);
					},
					{ once: true },
				);
				input.addEventListener("cancel", () => finish(null), { once: true });
				this.browserWindow.document.body.append(input);
				input.click();
			});
		} catch (error) {
			if (isAbortError(error)) return null;
			throw new BackupError("BACKUP_FILE_INVALID", error);
		}
	}
}
