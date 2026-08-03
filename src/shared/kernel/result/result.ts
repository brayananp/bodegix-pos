/**
 * Tipo Result para manejo explícito de errores sin excepciones.
 *
 * No es obligatorio usarlo en toda la aplicación.
 * Úsalo cuando quieras que el caller maneje errores sin try/catch,
 * especialmente en casos de uso del dominio.
 *
 * @example
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) return err("División por cero");
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.ok) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error); // "División por cero"
 * }
 */

export type Result<T, E = string> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: E };

/**
 * Crea un Result exitoso.
 */
export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

/**
 * Crea un Result de error.
 */
export function err<E>(error: E): Result<never, E> {
	return { ok: false, error };
}

/**
 * Verifica si un Result es exitoso.
 * Útil como type guard.
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
	return result.ok;
}

/**
 * Verifica si un Result es un error.
 * Útil como type guard.
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
	return !result.ok;
}

/**
 * Extrae el valor de un Result exitoso, o lanza si es un error.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
	if (result.ok) return result.value;
	throw new Error(`unwrap() llamado en un Result de error: ${String(result.error)}`);
}
