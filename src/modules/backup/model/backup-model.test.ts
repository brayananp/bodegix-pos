import { describe, expect, it } from "vitest";
import {
	canonicalizeJson,
	encodeBackupContainer,
	parseBackupContainer,
} from "../infrastructure/backup-container-codec";
import { BrowserBackupCryptoGateway } from "../infrastructure/browser-backup-crypto-gateway";
import { readBlobAsArrayBuffer, readBlobAsText } from "../infrastructure/blob-readers";
import {
	BACKUP_FILE_EXTENSION,
	BACKUP_MAGIC_HEADER,
	BackupError,
	backupManifestV1Schema,
	buildBackupFileName,
	getBackupReminderStatus,
	MAX_BACKUP_MANIFEST_SIZE_BYTES,
	resolveBackupMigration,
	type BodegixBackupManifestCoreV1,
	type BodegixBackupManifestV1,
} from ".";

const cryptoGateway = new BrowserBackupCryptoGateway();
const payload = new Blob(["payload-valid"]);

async function validManifest(): Promise<BodegixBackupManifestV1> {
	const core: BodegixBackupManifestCoreV1 = {
		formatName: "bodegix-backup",
		formatVersion: 1,
		createdAt: Date.UTC(2026, 7, 8, 15, 30, 0),
		source: "manual",
		application: { name: "Bodegix POS", version: "0.1.0" },
		database: { name: "BodegixPOS", schemaVersion: 7 },
		installation: {
			installationId: "installation-1",
			businessName: "Bodega Central",
			currency: "PEN",
			timezone: "America/Lima",
		},
		payload: { byteLength: payload.size, sha256: await cryptoGateway.sha256(payload) },
		tables: [{ name: "products", rowCount: 1, schema: "id, name" }],
	};
	return {
		...core,
		integrity: {
			manifestSha256: await cryptoGateway.sha256(new TextEncoder().encode(canonicalizeJson(core))),
		},
	};
}

describe("Bodegix Backup Format v1", () => {
	it("codifica y decodifica el contenedor sin transformar el payload", async () => {
		const manifest = await validManifest();
		const file = await encodeBackupContainer(manifest, payload);
		expect(await readBlobAsText(file.slice(0, BACKUP_MAGIC_HEADER.length))).toBe(
			BACKUP_MAGIC_HEADER,
		);
		const parsed = await parseBackupContainer(file, cryptoGateway);
		expect(parsed.manifest).toEqual(manifest);
		expect(await readBlobAsText(parsed.payload)).toBe("payload-valid");
	});

	it.each([
		["firma incorrecta", new Blob(["NO_ES_BODEGIX\n1\n{}x"]), "BACKUP_MAGIC_INVALID"],
		["archivo truncado", new Blob([`${BACKUP_MAGIC_HEADER}\n20\n{}`]), "BACKUP_FILE_TRUNCATED"],
		[
			"manifiesto excesivo",
			new Blob([`${BACKUP_MAGIC_HEADER}\n${MAX_BACKUP_MANIFEST_SIZE_BYTES + 1}\n`]),
			"BACKUP_MANIFEST_TOO_LARGE",
		],
	])("rechaza %s", async (_label, file, code) => {
		await expect(parseBackupContainer(file as Blob, cryptoGateway)).rejects.toMatchObject({ code });
	});

	it("rechaza payload alterado, bytes adicionales y manifiesto alterado", async () => {
		const manifest = await validManifest();
		const file = await encodeBackupContainer(manifest, payload);
		const bytes = new Uint8Array(await readBlobAsArrayBuffer(file));
		bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 1;
		await expect(parseBackupContainer(new Blob([bytes]), cryptoGateway)).rejects.toMatchObject({
			code: "BACKUP_CHECKSUM_MISMATCH",
		});
		await expect(
			parseBackupContainer(new Blob([file, "extra"]), cryptoGateway),
		).rejects.toMatchObject({
			code: "BACKUP_FILE_INVALID",
		});
		const altered = {
			...manifest,
			installation: { ...manifest.installation, businessName: "Otro" },
		};
		const json = new TextEncoder().encode(canonicalizeJson(altered));
		const alteredFile = new Blob([`${BACKUP_MAGIC_HEADER}\n${json.length}\n`, json, payload]);
		await expect(parseBackupContainer(alteredFile, cryptoGateway)).rejects.toMatchObject({
			code: "BACKUP_MANIFEST_CHECKSUM_MISMATCH",
		});
	});

	it("rechaza payload vacío durante la codificación", async () => {
		await expect(encodeBackupContainer(await validManifest(), new Blob())).rejects.toMatchObject({
			code: "BACKUP_FILE_INVALID",
		});
	});

	it("produce SHA-256 hexadecimal conocido y falla sin Web Crypto", async () => {
		expect(await cryptoGateway.sha256(new TextEncoder().encode("abc"))).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
		const gateway = new BrowserBackupCryptoGateway();
		const original = globalThis.crypto;
		Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });
		try {
			await expect(gateway.sha256(new Uint8Array([1]))).rejects.toMatchObject({
				code: "BACKUP_CRYPTO_UNAVAILABLE",
			});
		} finally {
			Object.defineProperty(globalThis, "crypto", { configurable: true, value: original });
		}
	});
});

describe("manifiesto, compatibilidad y recordatorio", () => {
	it("valida orden, duplicados, hashes y timestamps", async () => {
		const manifest = await validManifest();
		expect(backupManifestV1Schema.safeParse(manifest).success).toBe(true);
		expect(backupManifestV1Schema.safeParse({ ...manifest, createdAt: -1 }).success).toBe(false);
		expect(
			backupManifestV1Schema.safeParse({
				...manifest,
				payload: { ...manifest.payload, sha256: "zz" },
			}).success,
		).toBe(false);
		const duplicate = { ...manifest, tables: [manifest.tables[0], manifest.tables[0]] };
		expect(backupManifestV1Schema.safeParse(duplicate).success).toBe(false);
		const unordered = {
			...manifest,
			tables: [
				{ name: "sales", rowCount: 0, schema: "id" },
				{ name: "products", rowCount: 0, schema: "id" },
			],
		};
		expect(backupManifestV1Schema.safeParse(unordered).success).toBe(false);
	});

	it("resuelve una cadena de migraciones y rechaza versiones sin plan o futuras", () => {
		const transform = resolveBackupMigration(5, 7, [
			{ fromSchemaVersion: 5, toSchemaVersion: 6, transform: (_table, value) => ({ value }) },
			{ fromSchemaVersion: 6, toSchemaVersion: 7, transform: (_table, value) => ({ value }) },
		]);
		expect(transform?.("products", { id: "1" })).toEqual({ value: { id: "1" } });
		expect(resolveBackupMigration(7, 7, [])).toBeUndefined();
		expect(() => resolveBackupMigration(6, 7, [])).toThrowError(BackupError);
		expect(() => resolveBackupMigration(8, 7, [])).toThrowError(
			expect.objectContaining({ code: "BACKUP_CREATED_BY_NEWER_APP" }),
		);
	});

	it.each([
		[null, 7, "never"],
		[Date.UTC(2026, 7, 7, 12), 7, "up_to_date"],
		[Date.UTC(2026, 7, 2, 12), 7, "due_soon"],
		[Date.UTC(2026, 6, 30, 12), 7, "overdue"],
		[Date.UTC(2026, 7, 2, 12), 3, "overdue"],
	])("calcula recordatorio %#", (lastBackupAt, backupReminderDays, expected) => {
		expect(
			getBackupReminderStatus({
				lastBackupAt,
				backupReminderDays,
				now: Date.UTC(2026, 7, 8, 5),
				timezone: "America/Lima",
			}),
		).toBe(expected);
	});

	it.each([
		["Bodega Central", "bodega-central"],
		["Ñandú & Café", "nandu-cafe"],
		[" ../../Mi tienda ", "mi-tienda"],
		["   ", "mi-bodega"],
	])("crea un nombre seguro para %s", (businessName, slug) => {
		const name = buildBackupFileName({
			businessName,
			createdAt: Date.UTC(2026, 7, 8, 15, 30, 0),
			timezone: "America/Lima",
			source: "manual",
		});
		expect(name).toContain(slug);
		expect(name.endsWith(BACKUP_FILE_EXTENSION)).toBe(true);
		expect(name).not.toMatch(/[\\/]/);
	});
});
