import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CashSessionSearchResult } from "../../application";
import type { CashSessionSummary } from "../../domain";
import { CashDifferenceDisplay } from "./cash-difference-display";
import { CashSessionList } from "./cash-session-list";
import { CashCurrentSummary, CashPaymentBreakdown } from "./cash-summary";

const summary: CashSessionSummary = {
	sessionId: "cash-1",
	status: "open",
	openingCashCents: 10_000,
	completedSalesCount: 0,
	totalSalesCents: 0,
	paymentTotals: {
		cashCents: 500,
		yapeCents: 200,
		plinCents: 0,
		cardCents: 0,
		bankTransferCents: 0,
	},
	manualDepositsCents: 2_000,
	manualWithdrawalsCents: 3_000,
	expectedCashCents: 9_500,
	countedCashCents: null,
	differenceCents: null,
	openedAt: 1_000,
	closedAt: null,
	snapshotAvailable: false,
};

describe("componentes de caja", () => {
	it("muestra resumen actual y separa pagos digitales", () => {
		render(
			<>
				<CashCurrentSummary summary={summary} />
				<CashPaymentBreakdown summary={summary} />
			</>,
		);
		expect(screen.getByText("Efectivo esperado")).toBeInTheDocument();
		expect(screen.getByText(/95\.00/)).toBeInTheDocument();
		expect(screen.getByText("Yape")).toBeInTheDocument();
	});

	it.each([
		[0, "Cuadrada"],
		[500, "Sobrante"],
		[-500, "Faltante"],
	] as const)("expresa la diferencia %s con texto", (difference, label) => {
		render(<CashDifferenceDisplay differenceCents={difference} />);
		expect(screen.getByText(label)).toBeInTheDocument();
	});

	it("presenta historial y abre un detalle por teclado/clic", async () => {
		const onView = vi.fn();
		const result: CashSessionSearchResult = {
			items: [
				{
					id: "cash-1",
					status: "closed",
					openingCashCents: 10_000,
					expectedCashCents: 9_500,
					countedCashCents: 9_500,
					differenceCents: 0,
					openedAt: 1_000,
					closedAt: 2_000,
				},
			],
			total: 1,
			page: 1,
			pageSize: 25,
			totalPages: 1,
		};
		render(<CashSessionList result={result} onView={onView} onPageChange={vi.fn()} />);
		await userEvent.click(screen.getByRole("button"));
		expect(onView).toHaveBeenCalledWith("cash-1");
	});
});
