import { describe, expect, it } from "vitest";
import { fromTimestamp, isValidTimestamp, nowTimestamp } from "./dates";

describe("nowTimestamp", () => {
	it("retorna un número", () => {
		expect(typeof nowTimestamp()).toBe("number");
	});

	it("retorna un timestamp válido", () => {
		expect(isValidTimestamp(nowTimestamp())).toBe(true);
	});

	it("retorna un valor cercano al tiempo actual", () => {
		const before = Date.now();
		const ts = nowTimestamp();
		const after = Date.now();
		expect(ts).toBeGreaterThanOrEqual(before);
		expect(ts).toBeLessThanOrEqual(after);
	});
});

describe("isValidTimestamp", () => {
	it("acepta 0 (epoch)", () => {
		expect(isValidTimestamp(0)).toBe(true);
	});

	it("acepta timestamp actual", () => {
		expect(isValidTimestamp(Date.now())).toBe(true);
	});

	it("rechaza negativos", () => {
		expect(isValidTimestamp(-1)).toBe(false);
	});

	it("rechaza NaN", () => {
		expect(isValidTimestamp(Number.NaN)).toBe(false);
	});

	it("rechaza Infinity", () => {
		expect(isValidTimestamp(Number.POSITIVE_INFINITY)).toBe(false);
	});

	it("rechaza decimales", () => {
		expect(isValidTimestamp(1000.5)).toBe(false);
	});

	it("rechaza timestamps demasiado grandes (> año 9999)", () => {
		expect(isValidTimestamp(253402300800001)).toBe(false);
	});
});

describe("fromTimestamp", () => {
	it("convierte epoch 0 a Date correctamente", () => {
		const d = fromTimestamp(0);
		expect(d).toBeInstanceOf(Date);
		expect(d.getTime()).toBe(0);
	});

	it("convierte un timestamp conocido", () => {
		const ts = 1700000000000;
		const d = fromTimestamp(ts);
		expect(d.getTime()).toBe(ts);
	});

	it("lanza para timestamp inválido", () => {
		expect(() => fromTimestamp(-1)).toThrow();
	});
});
