import { describe, expect, it } from "vitest";
import { addBusinessDays, getBusinessDayRange, getBusinessToday, isValidBusinessDate } from ".";

describe("fecha comercial", () => {
	it("construye un intervalo semiabierto con zona IANA", () => {
		const range = getBusinessDayRange("2026-08-03", "America/Lima");
		expect(range).toEqual({
			date: "2026-08-03",
			timezone: "America/Lima",
			start: Date.parse("2026-08-03T05:00:00.000Z"),
			endExclusive: Date.parse("2026-08-04T05:00:00.000Z"),
		});
	});

	it("respeta días de 23 horas en zonas con cambio horario", () => {
		const range = getBusinessDayRange("2026-03-08", "America/New_York");
		expect(range.endExclusive - range.start).toBe(23 * 60 * 60 * 1_000);
	});

	it("obtiene hoy y navega fechas sin depender de la zona del navegador", () => {
		expect(getBusinessToday("America/Lima", Date.parse("2026-08-04T03:00:00Z"))).toBe("2026-08-03");
		expect(addBusinessDays("2026-02-28", 1)).toBe("2026-03-01");
	});

	it.each(["", "03-08-2026", "2026-02-30", "2026-8-3"])("rechaza %s", (value) => {
		expect(isValidBusinessDate(value)).toBe(false);
	});
});
