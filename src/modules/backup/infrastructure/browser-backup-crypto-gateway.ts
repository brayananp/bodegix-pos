import type { BackupCryptoGateway } from "../application";
import { BackupError } from "../model";
import { readBlobAsArrayBuffer } from "./blob-readers";

export class BrowserBackupCryptoGateway implements BackupCryptoGateway {
	async sha256(value: Blob | Uint8Array): Promise<string> {
		if (!globalThis.crypto?.subtle) throw new BackupError("BACKUP_CRYPTO_UNAVAILABLE");
		const bytes =
			value instanceof Blob ? await readBlobAsArrayBuffer(value) : Uint8Array.from(value).buffer;
		const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
		return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
			"",
		);
	}
}
