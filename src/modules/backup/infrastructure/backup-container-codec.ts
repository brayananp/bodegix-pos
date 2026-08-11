import type { BackupCryptoGateway } from "../application";
import {
	BACKUP_MAGIC_HEADER,
	BACKUP_MIME_TYPE,
	BackupError,
	backupManifestV1Schema,
	MAX_BACKUP_FILE_SIZE_BYTES,
	MAX_BACKUP_MANIFEST_SIZE_BYTES,
	type BodegixBackupManifestCoreV1,
	type BodegixBackupManifestV1,
	type ParsedBackupContainer,
} from "../model";
import { readBlobAsText } from "./blob-readers";

export function canonicalizeJson(value: unknown): string {
	if (value === null || typeof value === "boolean" || typeof value === "string") {
		return JSON.stringify(value);
	}
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new BackupError("BACKUP_MANIFEST_INVALID");
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) return `[${value.map(canonicalizeJson).join(",")}]`;
	if (typeof value === "object") {
		const record = value as Record<string, unknown>;
		return `{${Object.keys(record)
			.sort((left, right) => left.localeCompare(right))
			.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(record[key])}`)
			.join(",")}}`;
	}
	throw new BackupError("BACKUP_MANIFEST_INVALID");
}

export async function encodeBackupContainer(
	manifest: BodegixBackupManifestV1,
	payload: Blob,
): Promise<Blob> {
	const parsed = backupManifestV1Schema.parse(manifest);
	const manifestBytes = new TextEncoder().encode(canonicalizeJson(parsed));
	if (manifestBytes.byteLength > MAX_BACKUP_MANIFEST_SIZE_BYTES) {
		throw new BackupError("BACKUP_MANIFEST_TOO_LARGE");
	}
	if (payload.size === 0 || payload.size !== parsed.payload.byteLength) {
		throw new BackupError("BACKUP_FILE_INVALID");
	}
	const prefix = `${BACKUP_MAGIC_HEADER}\n${manifestBytes.byteLength}\n`;
	const file = new Blob([prefix, manifestBytes, payload], { type: BACKUP_MIME_TYPE });
	if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) throw new BackupError("BACKUP_FILE_TOO_LARGE");
	return file;
}

function manifestCore(manifest: BodegixBackupManifestV1): BodegixBackupManifestCoreV1 {
	return {
		formatName: manifest.formatName,
		formatVersion: manifest.formatVersion,
		createdAt: manifest.createdAt,
		source: manifest.source,
		application: manifest.application,
		database: manifest.database,
		installation: manifest.installation,
		payload: manifest.payload,
		tables: manifest.tables,
	};
}

export async function parseBackupContainer(
	file: Blob,
	cryptoGateway: BackupCryptoGateway,
): Promise<ParsedBackupContainer> {
	if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) throw new BackupError("BACKUP_FILE_TOO_LARGE");
	if (file.size === 0) throw new BackupError("BACKUP_FILE_TRUNCATED");
	const headerProbeSize = Math.min(file.size, BACKUP_MAGIC_HEADER.length + 32);
	const probe = await readBlobAsText(file.slice(0, headerProbeSize));
	const firstNewline = probe.indexOf("\n");
	if (firstNewline < 0) throw new BackupError("BACKUP_FILE_TRUNCATED");
	if (probe.slice(0, firstNewline) !== BACKUP_MAGIC_HEADER) {
		throw new BackupError("BACKUP_MAGIC_INVALID");
	}
	const secondNewline = probe.indexOf("\n", firstNewline + 1);
	if (secondNewline < 0) throw new BackupError("BACKUP_FILE_TRUNCATED");
	const lengthText = probe.slice(firstNewline + 1, secondNewline);
	if (!/^[1-9]\d*$/.test(lengthText)) throw new BackupError("BACKUP_MANIFEST_INVALID");
	const manifestLength = Number(lengthText);
	if (!Number.isSafeInteger(manifestLength)) throw new BackupError("BACKUP_MANIFEST_INVALID");
	if (manifestLength > MAX_BACKUP_MANIFEST_SIZE_BYTES) {
		throw new BackupError("BACKUP_MANIFEST_TOO_LARGE");
	}
	const manifestOffset = secondNewline + 1;
	const payloadOffset = manifestOffset + manifestLength;
	if (payloadOffset >= file.size) throw new BackupError("BACKUP_FILE_TRUNCATED");
	let json: unknown;
	try {
		json = JSON.parse(await readBlobAsText(file.slice(manifestOffset, payloadOffset)));
	} catch (error) {
		throw new BackupError("BACKUP_MANIFEST_INVALID", error);
	}
	if (json && typeof json === "object" && "formatVersion" in json) {
		const version = (json as { formatVersion?: unknown }).formatVersion;
		if (typeof version === "number" && version > 1) {
			throw new BackupError("BACKUP_FORMAT_UNSUPPORTED");
		}
	}
	const parsedManifest = backupManifestV1Schema.safeParse(json);
	if (!parsedManifest.success) {
		throw new BackupError("BACKUP_MANIFEST_INVALID", parsedManifest.error);
	}
	const manifest = parsedManifest.data;
	const expectedTotal = payloadOffset + manifest.payload.byteLength;
	if (expectedTotal > file.size) throw new BackupError("BACKUP_FILE_TRUNCATED");
	if (expectedTotal < file.size) throw new BackupError("BACKUP_FILE_INVALID");
	const expectedManifestHash = await cryptoGateway.sha256(
		new TextEncoder().encode(canonicalizeJson(manifestCore(manifest))),
	);
	if (expectedManifestHash !== manifest.integrity.manifestSha256) {
		throw new BackupError("BACKUP_MANIFEST_CHECKSUM_MISMATCH");
	}
	const payload = file.slice(payloadOffset, expectedTotal);
	const expectedPayloadHash = await cryptoGateway.sha256(payload);
	if (expectedPayloadHash !== manifest.payload.sha256) {
		throw new BackupError("BACKUP_CHECKSUM_MISMATCH");
	}
	return { manifest, payload };
}
