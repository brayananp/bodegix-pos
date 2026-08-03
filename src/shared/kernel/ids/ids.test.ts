import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createId, isValidId, restoreIdGenerator, setIdGenerator } from "./ids";

describe("createId", () => {
	it("genera un string no vacío", () => {
		const id = createId();
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThan(0);
	});

	it("genera IDs únicos en llamadas consecutivas", () => {
		const id1 = createId();
		const id2 = createId();
		expect(id1).not.toBe(id2);
	});

	it("genera un UUID v4 válido por defecto", () => {
		const id = createId();
		expect(isValidId(id)).toBe(true);
	});
});

describe("setIdGenerator / restoreIdGenerator", () => {
	beforeEach(() => {
		setIdGenerator(() => "fixed-test-id-0000-0000-000000000000");
	});

	afterEach(() => {
		restoreIdGenerator();
	});

	it("permite sustituir el generador durante pruebas", () => {
		const id = createId();
		expect(id).toBe("fixed-test-id-0000-0000-000000000000");
	});

	it("restaura el generador original después del test", () => {
		restoreIdGenerator();
		const id = createId();
		// Después de restaurar debe ser un UUID válido real
		expect(isValidId(id)).toBe(true);
	});
});

describe("isValidId", () => {
	it("valida un UUID v4 correcto", () => {
		expect(isValidId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
	});

	it("valida otro UUID v4 en el mismo formato", () => {
		// Este también es un UUID v4 válido (versión 4 = cuarto grupo empieza con 4)
		expect(isValidId("6ba7b810-9dad-41d1-80b4-00c04fd430c8")).toBe(true);
	});

	it("rechaza cadenas sin formato UUID", () => {
		expect(isValidId("not-a-uuid")).toBe(false);
		expect(isValidId("")).toBe(false);
		expect(isValidId("123")).toBe(false);
	});

	it("rechaza UUIDs con caracteres inválidos", () => {
		expect(isValidId("550e8400-e29b-41d4-g716-446655440000")).toBe(false);
	});
});
