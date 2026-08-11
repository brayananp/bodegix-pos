import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const PUBLIC_DIR = resolve(".output/public");
const BUDGETS = { publicBytes: 1_950_000, javascriptBytes: 1_420_000, maxChunkBytes: 1_100_000 };

async function files(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	return (
		await Promise.all(entries.map((entry) => {
			const path = join(directory, entry.name);
			return entry.isDirectory() ? files(path) : Promise.resolve([path]);
		}))
	).flat();
}

const paths = await files(PUBLIC_DIR);
const measured = await Promise.all(paths.map(async (path) => ({ path, bytes: (await stat(path)).size })));
const javascript = measured.filter(({ path }) => extname(path) === ".js");
const sourceMaps = measured.filter(({ path }) => extname(path) === ".map");
const largestChunk = javascript.toSorted((a, b) => b.bytes - a.bytes)[0];
const summary = {
	generatedAt: new Date().toISOString(),
	budgets: BUDGETS,
	actual: {
		publicFiles: measured.length,
		publicBytes: measured.reduce((sum, file) => sum + file.bytes, 0),
		javascriptFiles: javascript.length,
		javascriptBytes: javascript.reduce((sum, file) => sum + file.bytes, 0),
		maxChunkBytes: largestChunk?.bytes ?? 0,
		maxChunk: largestChunk ? relative(PUBLIC_DIR, largestChunk.path).replaceAll("\\", "/") : null,
		sourceMaps: sourceMaps.length,
	},
};

const failures = [];
for (const key of ["publicBytes", "javascriptBytes", "maxChunkBytes"]) {
	if (summary.actual[key] > BUDGETS[key]) failures.push(`${key}: ${summary.actual[key]} > ${BUDGETS[key]}`);
}
if (sourceMaps.length > 0) failures.push(`sourceMaps: ${sourceMaps.length} > 0`);
if (javascript.some(({ path }) => /(?:fixture|mock|\.test|\.spec)/i.test(path))) {
	failures.push("test fixture detected in production JavaScript filenames");
}

const outputIndex = process.argv.indexOf("--write");
if (outputIndex >= 0 && process.argv[outputIndex + 1]) {
	const output = resolve(process.argv[outputIndex + 1]);
	await mkdir(resolve(output, ".."), { recursive: true });
	await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`);
}

console.log(JSON.stringify(summary, null, 2));
if (failures.length) {
	console.error(`Bundle budget failed:\n- ${failures.join("\n- ")}`);
	process.exitCode = 1;
}
