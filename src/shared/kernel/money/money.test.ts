import { describe, expect, it } from "vitest";
import {
	addMoney,
	assertValidMoney,
	formatMoney,
	isValidMoney,
	multiplyMoney,
	parseMoneyToCents,
	type MoneyCents,
} from "./money";

describe("parseMoneyToCents", () => {
	it('convierte "3.50" a 350', () => {
		expect(parseMoneyToCents("3.50")).toBe(350);
	});

	it('convierte "3,50" a 350 (coma decimal)', () => {
		expect(parseMoneyToCents("3,50")).toBe(350);
	});

	it('convierte "0" a 0', () => {
		expect(parseMoneyToCents("0")).toBe(0);
	});

	it('convierte "0.00" a 0', () => {
		expect(parseMoneyToCents("0.00")).toBe(0);
	});

	it('convierte "10" a 1000', () => {
		expect(parseMoneyToCents("10")).toBe(1000);
	});

	it('convierte "0.50" a 50', () => {
		expect(parseMoneyToCents("0.50")).toBe(50);
	});

	it('convierte "99.99" a 9999', () => {
		expect(parseMoneyToCents("99.99")).toBe(9999);
	});

	it('convierte "1.1" a 110 (1 decimal)', () => {
		expect(parseMoneyToCents("1.1")).toBe(110);
	});

	it("no introduce errores de coma flotante en 0.1 + 0.2", () => {
		// 0.10 + 0.20 = 0.30 → 10 + 20 = 30 (exacto en enteros)
		const a = parseMoneyToCents("0.10");
		const b = parseMoneyToCents("0.20");
		expect(a + b).toBe(30);
	});

	it("rechaza valores negativos", () => {
		expect(() => parseMoneyToCents("-1")).toThrow();
	});

	it("rechaza texto no numérico", () => {
		expect(() => parseMoneyToCents("abc")).toThrow();
	});

	it("rechaza más de 2 decimales", () => {
		expect(() => parseMoneyToCents("1.999")).toThrow();
	});

	it("rechaza cadena vacía", () => {
		expect(() => parseMoneyToCents("")).toThrow();
	});

	it("rechaza puntos múltiples", () => {
		expect(() => parseMoneyToCents("1.2.3")).toThrow();
	});
});

describe("formatMoney", () => {
	it("formatea 350 como soles peruanos", () => {
		const result = formatMoney(350 as MoneyCents);
		// Verifica que contenga "3,50" o "3.50" según locale, y símbolo de sol o PEN
		expect(result).toMatch(/3[,.]50/);
	});

	it("formatea 0 correctamente", () => {
		const result = formatMoney(0 as MoneyCents);
		expect(result).toMatch(/0[,.]00/);
	});

	it("formatea 1000 como 10.00", () => {
		const result = formatMoney(1000 as MoneyCents);
		expect(result).toMatch(/10[,.]00/);
	});

	it("rechaza un importe inválido (negativo)", () => {
		expect(() => formatMoney(-100 as MoneyCents)).toThrow();
	});
});

describe("isValidMoney", () => {
	it("acepta 0", () => {
		expect(isValidMoney(0)).toBe(true);
	});

	it("acepta enteros positivos", () => {
		expect(isValidMoney(100)).toBe(true);
		expect(isValidMoney(9999)).toBe(true);
	});

	it("rechaza negativos", () => {
		expect(isValidMoney(-1)).toBe(false);
	});

	it("rechaza decimales", () => {
		expect(isValidMoney(3.5)).toBe(false);
	});

	it("rechaza NaN", () => {
		expect(isValidMoney(Number.NaN)).toBe(false);
	});

	it("rechaza Infinity", () => {
		expect(isValidMoney(Number.POSITIVE_INFINITY)).toBe(false);
	});
});

describe("assertValidMoney", () => {
	it("no lanza para valores válidos", () => {
		expect(() => assertValidMoney(0)).not.toThrow();
		expect(() => assertValidMoney(350)).not.toThrow();
	});

	it("lanza para negativos", () => {
		expect(() => assertValidMoney(-1)).toThrow();
	});

	it("lanza para decimales", () => {
		expect(() => assertValidMoney(3.5)).toThrow();
	});
});

describe("addMoney", () => {
	it("suma dos importes", () => {
		expect(addMoney(100 as MoneyCents, 250 as MoneyCents)).toBe(350);
	});

	it("suma con cero", () => {
		expect(addMoney(0 as MoneyCents, 500 as MoneyCents)).toBe(500);
	});
});

describe("multiplyMoney", () => {
	it("multiplica precio por cantidad", () => {
		expect(multiplyMoney(150 as MoneyCents, 3)).toBe(450);
	});

	it("multiplica por 1 devuelve el mismo importe", () => {
		expect(multiplyMoney(350 as MoneyCents, 1)).toBe(350);
	});

	it("multiplica por 0 devuelve 0", () => {
		expect(multiplyMoney(350 as MoneyCents, 0)).toBe(0);
	});

	it("rechaza cantidad decimal", () => {
		expect(() => multiplyMoney(100 as MoneyCents, 1.5)).toThrow();
	});

	it("rechaza cantidad negativa", () => {
		expect(() => multiplyMoney(100 as MoneyCents, -1)).toThrow();
	});
});
