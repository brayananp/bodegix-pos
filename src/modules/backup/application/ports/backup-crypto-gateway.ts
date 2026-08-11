export interface BackupCryptoGateway {
	sha256(value: Blob | Uint8Array): Promise<string>;
}
