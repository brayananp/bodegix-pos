export type CatalogErrorCode =
	| "CATEGORY_NAME_ALREADY_EXISTS"
	| "CATEGORY_NOT_FOUND"
	| "CATEGORY_INACTIVE"
	| "INVALID_CATEGORY"
	| "PRODUCT_BARCODE_ALREADY_EXISTS"
	| "PRODUCT_NOT_FOUND"
	| "INVALID_PRODUCT"
	| "CATALOG_PERSISTENCE_ERROR";

const CATALOG_ERROR_MESSAGES: Record<CatalogErrorCode, string> = {
	CATEGORY_NAME_ALREADY_EXISTS: "Ya existe una categoría con ese nombre.",
	CATEGORY_NOT_FOUND: "La categoría ya no existe.",
	CATEGORY_INACTIVE: "Selecciona una categoría activa.",
	INVALID_CATEGORY: "Revisa los datos de la categoría.",
	PRODUCT_BARCODE_ALREADY_EXISTS: "Ese código ya pertenece a otro producto activo.",
	PRODUCT_NOT_FOUND: "El producto ya no existe.",
	INVALID_PRODUCT: "Revisa los datos del producto.",
	CATALOG_PERSISTENCE_ERROR: "No se pudo guardar el catálogo local.",
};

export class CatalogError extends Error {
	readonly code: CatalogErrorCode;
	override readonly cause?: unknown;

	constructor(code: CatalogErrorCode, cause?: unknown, message = CATALOG_ERROR_MESSAGES[code]) {
		super(message);
		this.name = "CatalogError";
		this.code = code;
		this.cause = cause;
	}
}

export function isCatalogError(error: unknown): error is CatalogError {
	return error instanceof CatalogError;
}
