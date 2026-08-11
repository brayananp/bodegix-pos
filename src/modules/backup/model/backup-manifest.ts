import { z } from "zod";
import { BACKUP_FORMAT_NAME, BACKUP_FORMAT_VERSION } from "./backup-container";

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);

export const backupTableManifestSchema = z
	.object({
		name: z.string().trim().min(1).max(120),
		rowCount: z.number().int().nonnegative(),
		schema: z.string().min(1).max(2_048),
	})
	.strict();

export const backupManifestCoreV1Schema = z
	.object({
		formatName: z.literal(BACKUP_FORMAT_NAME),
		formatVersion: z.literal(BACKUP_FORMAT_VERSION),
		createdAt: z.number().int().positive(),
		source: z.enum(["manual", "pre_restore"]),
		application: z
			.object({ name: z.literal("Bodegix POS"), version: z.string().trim().min(1).max(40) })
			.strict(),
		database: z
			.object({
				name: z.string().trim().min(1).max(120),
				schemaVersion: z.number().int().positive(),
			})
			.strict(),
		installation: z
			.object({
				installationId: z.string().trim().min(1).max(120),
				businessName: z.string().trim().min(1).max(160),
				currency: z.literal("PEN"),
				timezone: z.literal("America/Lima"),
			})
			.strict(),
		payload: z.object({ byteLength: z.number().int().positive(), sha256: sha256Schema }).strict(),
		tables: z.array(backupTableManifestSchema).min(1),
	})
	.strict()
	.superRefine(({ tables }, context) => {
		const names = tables.map(({ name }) => name);
		if (new Set(names).size !== names.length) {
			context.addIssue({
				code: "custom",
				message: "Las tablas no pueden repetirse",
				path: ["tables"],
			});
		}
		const sorted = [...names].sort((left, right) => left.localeCompare(right));
		if (names.some((name, index) => name !== sorted[index])) {
			context.addIssue({
				code: "custom",
				message: "Las tablas deben estar ordenadas",
				path: ["tables"],
			});
		}
	});

export const backupManifestV1Schema = backupManifestCoreV1Schema.safeExtend({
	integrity: z.object({ manifestSha256: sha256Schema }).strict(),
});

export type BackupSource = "manual" | "pre_restore";
export type BodegixBackupManifestCoreV1 = z.infer<typeof backupManifestCoreV1Schema>;
export type BodegixBackupManifestV1 = z.infer<typeof backupManifestV1Schema>;
