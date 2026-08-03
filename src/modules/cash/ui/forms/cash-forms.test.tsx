import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/setup/test-router";
import type { CashUnitOfWork } from "../../application";
import type { CashSessionSummary } from "../../domain";
import { CashMovementForm } from "./cash-movement-form";
import { CloseCashForm } from "./close-cash-form";
import { OpenCashForm } from "./open-cash-form";

function unitOfWork(): CashUnitOfWork {
	return {
		openSession: vi.fn(async ({ openingCashCents }) => ({
			id: "cash-1",
			status: "open" as const,
			openingCashCents,
			expectedCashCents: null,
			countedCashCents: null,
			differenceCents: null,
			openedAt: 1,
			closedAt: null,
		})),
		registerDeposit: vi.fn(async (input) => ({
			id: "movement-1",
			type: "deposit",
			createdAt: 2,
			...input,
		})),
		registerWithdrawal: vi.fn(async (input) => ({
			id: "movement-1",
			type: "withdrawal",
			createdAt: 2,
			...input,
		})),
		closeSession: vi.fn(),
	};
}

const summary: CashSessionSummary = {
	sessionId: "cash-1",
	status: "open",
	openingCashCents: 10_000,
	completedSalesCount: 0,
	totalSalesCents: 0,
	paymentTotals: { cashCents: 0, yapeCents: 0, plinCents: 0, cardCents: 0, bankTransferCents: 0 },
	manualDepositsCents: 0,
	manualWithdrawalsCents: 0,
	expectedCashCents: 10_000,
	countedCashCents: null,
	differenceCents: null,
	openedAt: 1,
	closedAt: null,
	snapshotAvailable: false,
};

describe("formularios de caja", () => {
	it("abre una caja con cero e impide doble envío", async () => {
		const uow = unitOfWork();
		const success = vi.fn();
		await renderWithRouter(
			<OpenCashForm unitOfWork={uow} onCancel={vi.fn()} onSuccess={success} />,
		);
		await userEvent.type(screen.getByLabelText("Efectivo inicial"), "0");
		await userEvent.click(screen.getByRole("button", { name: "Abrir caja" }));
		expect(uow.openSession).toHaveBeenCalledTimes(1);
		expect(success).toHaveBeenCalled();
	});

	it("muestra y bloquea un retiro superior al esperado", async () => {
		const uow = unitOfWork();
		await renderWithRouter(
			<CashMovementForm
				mode="withdrawal"
				cashSessionId="cash-1"
				currentExpectedCashCents={10_000}
				unitOfWork={uow}
				onCancel={vi.fn()}
				onSuccess={vi.fn()}
			/>,
		);
		await userEvent.type(screen.getByLabelText("Importe del retiro"), "120");
		await userEvent.type(screen.getByLabelText("Motivo"), "Pago a proveedor");
		expect(
			screen.getByText("El retiro supera el efectivo esperado disponible."),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Registrar retiro" })).toBeDisabled();
	});

	it("actualiza la diferencia del cierre de forma reactiva", async () => {
		await renderWithRouter(
			<CloseCashForm
				summary={summary}
				unitOfWork={unitOfWork()}
				onCancel={vi.fn()}
				onSuccess={vi.fn()}
			/>,
		);
		await userEvent.type(screen.getByLabelText("Efectivo contado"), "98");
		expect(screen.getByText("Faltante")).toBeInTheDocument();
		expect(within(screen.getByRole("status")).getAllByText(/2\.00/)).toHaveLength(2);
	});
});
