import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DailyOperationalSummary } from "../../model";
import { KeyMetrics } from "./summary-sections";
import { DayStatus, SummaryError, SummaryLoading } from "./summary-states";

function summary(
	overrides: Partial<Pick<DailyOperationalSummary, "status" | "closeChecklist">> = {},
): DailyOperationalSummary {
	return {
		date: "2026-08-03",
		timezone: "America/Lima",
		periodStart: Date.parse("2026-08-03T05:00:00Z"),
		periodEndExclusive: Date.parse("2026-08-04T05:00:00Z"),
		generatedAt: Date.now(),
		status: "ready_for_review",
		sales: {
			completedSalesCount: 3,
			completedSalesCents: 3_000,
			voidedSalesCreatedCount: 0,
			voidedSalesCreatedCents: 0,
			voidOperationsCount: 1,
			voidOperationsCents: 500,
			lineCount: 4,
			unitCount: 6,
			averageTicketCents: 1_000,
		},
		payments: {
			cashCents: 3_000,
			yapeCents: 0,
			plinCents: 0,
			cardCents: 0,
			bankTransferCents: 0,
			totalCents: 3_000,
		},
		cash: {
			relatedSessionCount: 0,
			openSessionCount: 0,
			closedSessionCount: 0,
			cashSalesCents: 3_000,
			manualDepositsCents: 0,
			manualWithdrawalsCents: 0,
			netOperationalCashFlowCents: 3_000,
			closedSessionDifferenceCents: 0,
			sessions: [],
		},
		inventory: {
			initialStockUnits: 0,
			purchaseEntryUnits: 0,
			adjustmentInUnits: 0,
			adjustmentOutUnits: 0,
			damagedUnits: 0,
			expiredUnits: 0,
			soldUnits: 6,
			restoredByVoidUnits: 0,
			currentLowStockProducts: 0,
			currentOutOfStockProducts: 0,
			currentProductsWithoutMovements: 0,
		},
		topProducts: [],
		recentSales: [],
		closeChecklist: {
			cashSessionsClosed: true,
			saleDraftEmpty: true,
			salesConsistent: true,
			paymentsConsistent: true,
			status: "pass",
			items: [],
		},
		...overrides,
	};
}

describe("componentes del resumen", () => {
	it("muestra el estado final y los cinco indicadores principales", () => {
		const value = summary();
		render(
			<>
				<DayStatus summary={value} />
				<KeyMetrics summary={value} />
			</>,
		);
		expect(screen.getByText("Operación finalizada")).toBeInTheDocument();
		expect(screen.getByText("Ventas válidas")).toBeInTheDocument();
		expect(screen.getByText(/30[.,]00/)).toBeInTheDocument();
		expect(screen.getByText("Unidades vendidas")).toBeInTheDocument();
		expect(screen.getByText("Anulaciones procesadas")).toBeInTheDocument();
	});

	it("prioriza el estado de revisión pendiente", () => {
		render(
			<DayStatus
				summary={summary({
					closeChecklist: {
						...summary().closeChecklist,
						status: "warning",
					},
				})}
			/>,
		);
		expect(screen.getByText("Revisión pendiente")).toBeInTheDocument();
	});

	it("expone carga accesible y reintento ante error", () => {
		const retry = vi.fn();
		const { rerender } = render(<SummaryLoading />);
		expect(screen.getByLabelText("Cargando resumen operativo")).toBeInTheDocument();
		rerender(<SummaryError onRetry={retry} />);
		fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
		expect(retry).toHaveBeenCalledOnce();
	});
});
