const STALE_CHUNK_MESSAGES = [
	"failed to fetch dynamically imported module",
	"error loading dynamically imported module",
	"importing a module script failed",
	"loading chunk",
	"chunkloaderror",
] as const;

export function isStaleChunkError(value: unknown): boolean {
	const message =
		value instanceof Error
			? `${value.name} ${value.message}`
			: typeof value === "string"
				? value
				: "";
	const normalized = message.toLowerCase();
	return STALE_CHUNK_MESSAGES.some((candidate) => normalized.includes(candidate));
}
