import { describe, expect, it } from "vitest";
import { settingsSearchSchema } from "./settings-search";

describe("settingsSearchSchema", () => {
	it("usa la sección general y ningún panel por defecto", () => {
		expect(settingsSearchSchema.parse({})).toEqual({ section: "general", panel: null });
	});

	it.each(["backup", "restore"] as const)("conserva el panel %s en la URL", (panel) => {
		expect(settingsSearchSchema.parse({ section: "data", panel })).toEqual({
			section: "data",
			panel,
		});
	});

	it("normaliza parámetros inválidos sin serializar estado efímero", () => {
		expect(
			settingsSearchSchema.parse({
				section: "other",
				panel: "progress",
				file: "secret.bodegix",
				confirmation: "RESTAURAR",
			}),
		).toEqual({ section: "general", panel: null });
	});
});
