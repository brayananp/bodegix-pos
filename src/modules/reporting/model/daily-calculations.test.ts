import { describe, expect, it } from "vitest";
import {
	ReportingError,
	buildDailyCloseChecklist,
	calculateAverageTicket,
	calculateNetOperationalCashFlow,
	calculatePaymentTotal,
	determineDailyOperationalStatus,
} from ".";

describe("cálculos de reporting", () => {
	it.each([
		[0, 0, 0],
		[1_001, 2, 501],
		[1_000, 3, 333],
	])("calcula ticket promedio", (total, count, expected) => {
		expect(calculateAverageTicket(total, count)).toBe(expected);
	});

	it("totaliza pagos y flujo sin incluir apertura", () => {
		expect(
			calculatePaymentTotal({
				cashCents: 100,
				yapeCents: 200,
				plinCents: 300,
				cardCents: 400,
				bankTransferCents: 500,
			}),
		).toBe(1_500);
		expect(calculateNetOperationalCashFlow(1_000, 300, 200)).toBe(1_100);
	});

	it("rechaza decimales y desbordamientos", () => {
		expect(() => calculateAverageTicket(1.5, 1)).toThrow(ReportingError);
		expect(() =>
			calculatePaymentTotal({
				cashCents: Number.MAX_SAFE_INTEGER,
				yapeCents: 1,
				plinCents: 0,
				cardCents: 0,
				bankTransferCents: 0,
			}),
		).toThrowError(expect.objectContaining({ code: "REPORTING_OVERFLOW" }));
	});

	it("deriva el estado sin persistirlo", () => {
		expect(determineDailyOperationalStatus({ hasActivity: false, openSessionCount: 0 })).toBe(
			"no_activity",
		);
		expect(determineDailyOperationalStatus({ hasActivity: true, openSessionCount: 1 })).toBe(
			"in_progress",
		);
		expect(determineDailyOperationalStatus({ hasActivity: true, openSessionCount: 0 })).toBe(
			"ready_for_review",
		);
	});

	it("prioriza fallos sobre advertencias en el checklist", () => {
		const checklist = buildDailyCloseChecklist({
			openSessionCount: 1,
			saleDraftItemCount: 2,
			salesConsistent: false,
			paymentsConsistent: true,
		});
		expect(checklist.status).toBe("fail");
		expect(checklist.items.map(({ status }) => status)).toEqual([
			"warning",
			"warning",
			"fail",
			"pass",
		]);
	});
});
