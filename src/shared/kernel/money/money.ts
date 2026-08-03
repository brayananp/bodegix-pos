/**
 * Utilidades de dinero para Bodegix POS.
 *
 * DECISIÓN: todos los importes se almacenan como enteros en céntimos (centavos).
 * - S/ 3.50 → 350 (MoneyCents)
 * - S/ 0.00 → 0
 * - Los cálculos siempre se hacen sobre enteros para evitar errores de coma flotante.
 *
 * ENTRADA parseMoneyToCents: acepta punto decimal (.) y coma decimal (,).
 * Ejemplo: "3.50" → 350, "3,50" → 350, "10" → 1000.
 *
 * ZONA: moneda inicial soles peruanos (PEN).
 */

/**
 * Representa un importe monetario en céntimos (entero ≥ 0).
 * Opaque brand para evitar confusión con otros números.
 */
export type MoneyCents = number & { readonly __brand: "MoneyCents" };

/**
 * Convierte una cadena de texto a MoneyCents.
 *
 * Acepta punto (.) o coma (,) como separador decimal.
 * Máximo 2 decimales.
 *
 * @throws {Error} Si el valor no es un número válido, es negativo,
 *                 tiene más de 2 decimales, o es NaN/Infinity.
 */
export function parseMoneyToCents(value: string): MoneyCents {
	// Normalizar separador decimal: reemplazar coma por punto
	const normalized = value.trim().replace(",", ".");

	// Verificar que sea un número válido con máximo 2 decimales
	if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
		throw new Error(
			`Valor monetario inválido: "${value}". ` +
				`Use formato numérico con máximo 2 decimales (ej: "3.50" o "10").`,
		);
	}

	const parsed = Number.parseFloat(normalized);

	if (!Number.isFinite(parsed)) {
		throw new Error(`Valor monetario inválido: "${value}".`);
	}

	if (parsed < 0) {
		throw new Error(`El importe no puede ser negativo. Recibido: "${value}".`);
	}

	// Multiplicar por 100 y redondear para eliminar residuos de coma flotante
	return Math.round(parsed * 100) as MoneyCents;
}

/**
 * Formatea céntimos como texto de moneda en soles peruanos.
 *
 * @example formatMoney(350) → "S/ 3.50"
 * @example formatMoney(0)   → "S/ 0.00"
 */
export function formatMoney(value: MoneyCents, currency: "PEN" = "PEN"): string {
	assertValidMoney(value);

	const amount = value / 100;

	try {
		return new Intl.NumberFormat("es-PE", {
			style: "currency",
			currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	} catch {
		// Fallback si el entorno no soporta Intl completo
		return `S/ ${amount.toFixed(2)}`;
	}
}

/**
 * Valida que un número sea un importe válido en céntimos.
 * - Debe ser entero
 * - Debe ser ≥ 0
 * - No puede ser NaN ni Infinity
 */
export function isValidMoney(value: number): value is MoneyCents {
	return (
		typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0
	);
}

/**
 * Aserción que lanza si el valor no es un MoneyCents válido.
 * Útil para narrowing de tipos en runtime.
 */
export function assertValidMoney(value: number): asserts value is MoneyCents {
	if (!isValidMoney(value)) {
		throw new Error(`Se esperaba un importe en céntimos válido (entero ≥ 0). Recibido: ${value}`);
	}
}

/**
 * Suma dos importes en céntimos.
 * Ambos deben ser MoneyCents válidos.
 */
export function addMoney(a: MoneyCents, b: MoneyCents): MoneyCents {
	assertValidMoney(a);
	assertValidMoney(b);
	return (a + b) as MoneyCents;
}

/**
 * Multiplica un importe en céntimos por una cantidad entera (stock, unidades).
 * Útil para calcular subtotales: precio * cantidad.
 */
export function multiplyMoney(price: MoneyCents, quantity: number): MoneyCents {
	assertValidMoney(price);

	if (!Number.isInteger(quantity) || quantity < 0) {
		throw new Error(`La cantidad debe ser un entero ≥ 0. Recibido: ${quantity}`);
	}

	return (price * quantity) as MoneyCents;
}
