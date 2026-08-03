export type LocalDatabaseErrorCode =
	| "INDEXED_DB_UNAVAILABLE"
	| "DATABASE_OPEN_FAILED"
	| "DATABASE_VERSION_UNSUPPORTED"
	| "DATABASE_INITIALIZATION_FAILED"
	| "APP_SETTINGS_INVALID"
	| "DATABASE_DIAGNOSTIC_FAILED";

const SAFE_MESSAGES: Record<LocalDatabaseErrorCode, string> = {
	INDEXED_DB_UNAVAILABLE: "El almacenamiento local no está disponible en este navegador.",
	DATABASE_OPEN_FAILED: "No se pudo abrir el almacenamiento local.",
	DATABASE_VERSION_UNSUPPORTED: "La versión del almacenamiento local no es compatible.",
	DATABASE_INITIALIZATION_FAILED: "No se pudo inicializar el almacenamiento local.",
	APP_SETTINGS_INVALID: "La configuración local está dañada o no es válida.",
	DATABASE_DIAGNOSTIC_FAILED: "No se pudo comprobar el estado del almacenamiento local.",
};

export class LocalDatabaseError extends Error {
	readonly code: LocalDatabaseErrorCode;
	override readonly cause: unknown;

	constructor(code: LocalDatabaseErrorCode, cause?: unknown) {
		super(SAFE_MESSAGES[code]);
		this.name = "LocalDatabaseError";
		this.code = code;
		this.cause = cause;
	}
}

export function toLocalDatabaseError(
	error: unknown,
	fallbackCode: LocalDatabaseErrorCode,
): LocalDatabaseError {
	if (error instanceof LocalDatabaseError) return error;
	return new LocalDatabaseError(fallbackCode, error);
}
