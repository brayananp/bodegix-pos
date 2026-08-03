/**
 * Utilidades de texto para Bodegix POS.
 *
 * DECISIÓN sobre tildes en búsquedas:
 * Se normalizan las tildes para búsqueda (NFD + remover diacríticos).
 * Esto permite buscar "cafe" y encontrar "café", "Café", "CAFÉ".
 * El almacenamiento siempre conserva el texto original con tildes.
 * Solo se normaliza al comparar o buscar.
 */

/**
 * Normaliza un texto para búsquedas de manera consistente:
 * - Trim (elimina espacios iniciales y finales)
 * - Colapsa espacios repetidos a uno solo
 * - Convierte a minúsculas
 * - Elimina tildes y diacríticos (NFD normalization)
 *
 * @example
 * normalizeSearchText("  Café  con   Leche  ") → "cafe con leche"
 * normalizeSearchText("ÁRBOL") → "arbol"
 * normalizeSearchText("niño") → "nino"
 */
export function normalizeSearchText(value: string): string {
	return value
		.trim()
		.replace(/\s+/g, " ")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

/**
 * Capitaliza la primera letra de una cadena y pone el resto en minúsculas.
 * Útil para normalizar nombres propios al guardar.
 *
 * @example capitalize("hOLA MUNDO") → "Hola mundo"
 */
export function capitalize(value: string): string {
	if (value.length === 0) return value;
	return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Trunca un texto a un número máximo de caracteres añadiendo "…" si es necesario.
 *
 * @example truncate("Aceite Vegetal de Girasol", 15) → "Aceite Vegetal…"
 */
export function truncate(value: string, maxLength: number): string {
	if (maxLength < 1) throw new Error("maxLength debe ser ≥ 1");
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength - 1)}…`;
}
