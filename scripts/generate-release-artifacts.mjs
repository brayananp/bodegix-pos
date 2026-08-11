import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const output = "artifacts/release";
mkdirSync(output, { recursive: true });
const pnpmCli = process.env.npm_execpath;

function runPnpm(args, options = {}) {
	if (pnpmCli) {
		return execFileSync(process.execPath, [pnpmCli, ...args], options);
	}
	return execFileSync("pnpm", args, options);
}

runPnpm(["sbom", "--sbom-format", "cyclonedx", "--prod", "--out", `${output}/sbom.cdx.json`], {
	stdio: "inherit",
});
const licenses = runPnpm(["licenses", "list", "--prod", "--json"], { encoding: "utf8" });
writeFileSync(`${output}/licenses.json`, licenses);
execFileSync(process.execPath, ["scripts/check-bundle.mjs", "--write", `${output}/bundle-summary.json`], {
	stdio: "inherit",
});
