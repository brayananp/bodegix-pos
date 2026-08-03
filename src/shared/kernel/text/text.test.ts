import { describe, expect, it } from "vitest";
import { capitalize, normalizeSearchText, truncate } from "./text";

describe("normalizeSearchText", () => {
	it("elimina espacios iniciales y finales", () => {
		expect(normalizeSearchText("  hola  ")).toBe("hola");
	});

	it("colapsa espacios repetidos a uno solo", () => {
		expect(normalizeSearchText("hola   mundo")).toBe("hola mundo");
	});

	it("convierte a minúsculas", () => {
		expect(normalizeSearchText("HOLA")).toBe("hola");
		expect(normalizeSearchText("Hola Mundo")).toBe("hola mundo");
	});

	it("elimina tildes para búsqueda", () => {
		expect(normalizeSearchText("café")).toBe("cafe");
		expect(normalizeSearchText("árbol")).toBe("arbol");
		expect(normalizeSearchText("niño")).toBe("nino");
		expect(normalizeSearchText("ñoño")).toBe("nono");
	});

	it("combina todas las transformaciones", () => {
		expect(normalizeSearchText("  Café  con   Leche  ")).toBe("cafe con leche");
	});

	it("maneja cadena vacía", () => {
		expect(normalizeSearchText("")).toBe("");
	});

	it("maneja solo espacios", () => {
		expect(normalizeSearchText("   ")).toBe("");
	});

	it("permite buscar 'cafe' y encontrar 'CAFÉ'", () => {
		const stored = "CAFÉ PERUANO";
		const query = "cafe peruano";
		expect(normalizeSearchText(stored)).toBe(normalizeSearchText(query));
	});
});

describe("capitalize", () => {
	it("capitaliza la primera letra", () => {
		expect(capitalize("hola")).toBe("Hola");
	});

	it("pone el resto en minúsculas", () => {
		expect(capitalize("hOLA MUNDO")).toBe("Hola mundo");
	});

	it("maneja cadena vacía", () => {
		expect(capitalize("")).toBe("");
	});

	it("maneja cadena de un carácter", () => {
		expect(capitalize("a")).toBe("A");
	});
});

describe("truncate", () => {
	it("no trunca si el texto es más corto que maxLength", () => {
		expect(truncate("Hola", 10)).toBe("Hola");
	});

	it("no trunca si el texto es igual a maxLength", () => {
		expect(truncate("Hola", 4)).toBe("Hola");
	});

	it("trunca y añade elipsis si excede maxLength", () => {
		expect(truncate("Aceite Vegetal de Girasol", 15)).toBe("Aceite Vegetal…");
	});

	it("lanza si maxLength es 0", () => {
		expect(() => truncate("hola", 0)).toThrow();
	});
});
