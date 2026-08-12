import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function git(...args: string[]): string {
	try {
		return execFileSync("git", args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return "";
	}
}

function normalizeTimestamp(value: string | undefined): string {
	if (!value) return "";
	const date = /^\d+$/.test(value) ? new Date(Number(value) * 1000) : new Date(value);
	return Number.isNaN(date.valueOf()) ? "" : date.toISOString();
}

export function getBuildMetadata(): {
	version: string;
	commitSha: string;
	buildTimestamp: string;
} {
	const packageJson = JSON.parse(
		readFileSync(new URL("../package.json", import.meta.url), "utf8"),
	) as { version: string };
	const commitSha =
		(process.env.COMMIT_SHA ??
			process.env.VERCEL_GIT_COMMIT_SHA ??
			process.env.GITHUB_SHA ??
			git("rev-parse", "HEAD")) || "unknown";
	const buildTimestamp =
		normalizeTimestamp(process.env.BUILD_TIMESTAMP) ||
		normalizeTimestamp(process.env.SOURCE_DATE_EPOCH) ||
		normalizeTimestamp(git("show", "-s", "--format=%cI", "HEAD")) ||
		"1970-01-01T00:00:00.000Z";

	return { version: packageJson.version, commitSha, buildTimestamp };
}
