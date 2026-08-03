/**
 * Generación y validación de identificadores únicos.
 *
 * Usa crypto.randomUUID() del navegador/Node.
 * Compatible con pruebas: se puede inyectar un generador alternativo.
 *
 * DECISIÓN: no usamos librerías UUID externas. crypto.randomUUID() está
 * disponible en todos los entornos objetivo (Chromium/Firefox/Node 19+).
 */

/**
 * Función de generación de ID. Puede sustituirse en pruebas.
 * @internal
 */
let _generator: () => string = () => crypto.randomUUID();

/**
 * Genera un nuevo ID único (UUID v4).
 *
 * @example
 * const id = createId(); // "550e8400-e29b-41d4-a716-446655440000"
 */
export function createId(): string {
	return _generator();
}

/**
 * Reemplaza el generador de IDs por uno controlado durante pruebas.
 * Restaurar siempre con `restoreIdGenerator()` al finalizar cada test.
 *
 * @example
 * beforeEach(() => setIdGenerator(() => "test-id-1234"));
 * afterEach(() => restoreIdGenerator());
 */
export function setIdGenerator(generator: () => string): void {
	_generator = generator;
}

/**
 * Restaura el generador de IDs al predeterminado (crypto.randomUUID).
 */
export function restoreIdGenerator(): void {
	_generator = () => crypto.randomUUID();
}

/**
 * Valida que una cadena sea un UUID v4 en formato estándar.
 *
 * @example
 * isValidId("550e8400-e29b-41d4-a716-446655440000") // true
 * isValidId("not-a-uuid") // false
 */
export function isValidId(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
