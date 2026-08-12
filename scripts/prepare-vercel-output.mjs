import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { getBuildMetadata } from "./build-metadata.ts";
import { DATABASE_SCHEMA_VERSION } from "../src/shared/infrastructure/local-db/schema/schema-version.ts";
import { BACKUP_FORMAT_VERSION } from "../src/modules/backup/model/backup-container.ts";

const root = resolve(".");
const publicDirectory = resolve(root, ".output", "public");
const outputDirectory = resolve(root, ".vercel", "output");
const staticDirectory = resolve(outputDirectory, "static");
if (!outputDirectory.startsWith(`${root}${sep}`)) {
	throw new Error("Directorio Vercel fuera del proyecto.");
}

const releaseConfig = JSON.parse(await readFile(resolve(root, "release.config.json"), "utf8"));
const databaseImpacts = new Set(["none", "backward_compatible", "forward_only"]);
if (!databaseImpacts.has(releaseConfig.databaseImpact)) {
	throw new Error("databaseImpact inválido en release.config.json.");
}
if (releaseConfig.databaseImpact === "forward_only" && releaseConfig.rollbackFrontendAllowed) {
	throw new Error("Release forward_only no puede permitir rollback frontend.");
}
if (!Number.isInteger(releaseConfig.minimumCompatibleBackupVersion)) {
	throw new Error("minimumCompatibleBackupVersion debe ser entero.");
}
const build = getBuildMetadata();
const release = {
	version: build.version,
	commit: build.commitSha,
	builtAt: build.buildTimestamp,
	databaseSchemaVersion: DATABASE_SCHEMA_VERSION,
	backupFormatVersion: BACKUP_FORMAT_VERSION,
	...releaseConfig,
};

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(staticDirectory, { recursive: true });
await cp(publicDirectory, staticDirectory, { recursive: true });
await cp(resolve(publicDirectory, "_shell.html"), resolve(staticDirectory, "index.html"));
await writeFile(resolve(staticDirectory, "release.json"), `${JSON.stringify(release, null, 2)}\n`);

const securityHeaders = {
	"Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self' blob:",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY"
};
const noCache = { "Cache-Control": "public, max-age=0, must-revalidate" };
const config = {
	version: 3,
	routes: [
		{ src: "/.*", headers: securityHeaders, continue: true },
		{
			src: "/assets/.*",
			headers: { "Cache-Control": "public, max-age=31536000, immutable" },
			continue: true,
		},
		{
			src: "^/(?:sale|products|inventory|cash|sales|summary|settings)?/?$",
			headers: noCache,
			continue: true,
		},
		{ src: "/(?:sw\\.js|manifest\\.webmanifest|release\\.json|index\\.html|_shell\\.html)", headers: noCache, continue: true },
		{ src: "/manifest\\.webmanifest", headers: { "Content-Type": "application/manifest+json" }, continue: true },
		{ handle: "filesystem" },
		{ src: "^/(?:sale|products|inventory|cash|sales|summary|settings)/?$", dest: "/index.html" },
	],
};
await writeFile(resolve(outputDirectory, "config.json"), `${JSON.stringify(config, null, 2)}\n`);
console.log(`Artifact Vercel preparado: ${build.version} · ${build.commitSha.slice(0, 7)}`);
