import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const outputDirectory = resolve(".output");
const publicDirectory = resolve(outputDirectory, "public");
const serverEntryPath = resolve(outputDirectory, "server", "index.mjs");
const assetPaths = [
	resolve(publicDirectory, "sw.js"),
	resolve(publicDirectory, "manifest.webmanifest"),
];

let serverEntry = await readFile(serverEntryPath, "utf8");

for (const assetPath of assetPaths) {
	const contents = await readFile(assetPath);
	const details = await stat(assetPath);
	const publicPath = `/${basename(assetPath)}`;
	const escapedPublicPath = publicPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const entryPattern = new RegExp(
		`("${escapedPublicPath}": \\{[\\s\\S]*?"etag": )[^\\r\\n]+([\\s\\S]*?"mtime": )"[^"]+"([\\s\\S]*?"size": )\\d+`,
	);
	const digest = createHash("sha1").update(contents).digest("base64").replace(/=+$/, "");
	const etag = `"${contents.length.toString(16)}-${digest}"`;
	if (!entryPattern.test(serverEntry)) {
		throw new Error(`No se encontró ${publicPath} en el manifiesto público de Nitro.`);
	}
	const nextEntry = serverEntry.replace(
		entryPattern,
		`$1${JSON.stringify(etag)},$2${JSON.stringify(details.mtime.toISOString())}$3${contents.length}`,
	);

	serverEntry = nextEntry;
}

await writeFile(serverEntryPath, serverEntry);
console.log("Metadatos PWA de Nitro sincronizados.");
