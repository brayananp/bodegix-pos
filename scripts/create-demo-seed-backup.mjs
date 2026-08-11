import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.DEMO_SEED_URL ?? "http://localhost:3000";
const output = resolve(process.env.DEMO_SEED_OUTPUT ?? "artifacts/demo/bodegix-demo-seed.bodegix");
const browser = await chromium.launch({ headless: true });

try {
	const page = await browser.newPage();
	await page.goto(`${baseUrl}/sale`, { waitUntil: "networkidle" });
	const artifact = await page.evaluate(async () => {
		const { seedDemoDatabase } = await import("/src/dev/demo-data/demo-database-seed.ts");
		const summary = await seedDemoDatabase();
		const { createBackup } = await import("/src/modules/backup/application/commands/create-backup.ts");
		const { createBackupServices } = await import("/src/modules/backup/infrastructure/index.ts");
		const services = createBackupServices();
		const created = await createBackup(services, { source: "manual" });
		return {
			bytes: Array.from(new Uint8Array(await created.file.blob.arrayBuffer())),
			fileName: created.file.name,
			summary,
		};
	});

	mkdirSync(dirname(output), { recursive: true });
	writeFileSync(output, Buffer.from(artifact.bytes));
	console.info(JSON.stringify({ output, fileName: artifact.fileName, ...artifact.summary }, null, 2));
} finally {
	await browser.close();
}
