import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SaleDetail, VoidSaleResult } from "../../application";
import { useSaleDetail, useSaleVoidResult } from "../hooks";
import { SaleHistorySheet } from "./sale-history-sheet";

vi.mock("../hooks", () => ({
	useSaleDetail: vi.fn(),
	useSaleVoidResult: vi.fn(),
}));

const sale: SaleDetail = {
	id: "sale-1",
	saleNumber: 1,
	formattedSaleNumber: "V-000001",
	status: "completed",
	subtotalCents: 350,
	totalCents: 350,
	createdAt: Date.parse("2026-08-08T15:00:00Z"),
	voidedAt: null,
	voidReason: null,
	cashSessionId: "cash-session-1",
	cashSessionStatus: "open",
	items: [
		{
			id: "item-1",
			productId: "product-1",
			productName: "Agua mineral",
			unitPriceCents: 350,
			unitCostCents: 200,
			quantity: 1,
			subtotalCents: 350,
			productAvailable: true,
		},
	],
	payments: [
		{
			id: "payment-1",
			method: "cash",
			amountCents: 350,
			status: "confirmed",
			providerLabel: null,
			operationReference: null,
			cashReceivedCents: 500,
			changeCents: 150,
			verifiedAt: Date.parse("2026-08-08T15:00:00Z"),
			voidedAt: null,
			voidOperationReference: null,
		},
	],
	inventoryMovements: [
		{
			id: "movement-1",
			productId: "product-1",
			productName: "Agua mineral",
			type: "sale",
			quantityDelta: -1,
			stockBefore: 10,
			stockAfter: 9,
			createdAt: Date.parse("2026-08-08T15:00:00Z"),
		},
	],
	voidEligibility: { eligible: true, reason: null },
};

const result: VoidSaleResult = {
	saleId: "sale-1",
	saleNumber: 1,
	totalCents: 350,
	restoredItemCount: 1,
	restoredUnitCount: 1,
	paymentReversals: [{ method: "cash", amountCents: 350, reversalReference: null }],
	cashSessionId: "cash-session-1",
	voidedAt: Date.parse("2026-08-08T15:05:00Z"),
	reason: "Cliente canceló",
};

const callbacks = {
	onClose: vi.fn(),
	onBack: vi.fn(),
	onStartVoid: vi.fn(),
	onVoided: vi.fn(),
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(useSaleDetail).mockReturnValue(sale);
	vi.mocked(useSaleVoidResult).mockReturnValue(null);
});

describe("Sheet del historial de ventas", () => {
	it("muestra snapshots, pagos, movimiento y acción elegible", async () => {
		render(<SaleHistorySheet saleId="sale-1" mode="detail" {...callbacks} />);
		expect(screen.getByRole("heading", { name: "Detalle de venta" })).toBeVisible();
		expect(screen.getAllByText("Agua mineral")).toHaveLength(2);
		expect(screen.getByText("Pagos originales")).toBeVisible();
		expect(screen.getByText(/Salida por venta/)).toBeVisible();
		await userEvent.click(screen.getByRole("button", { name: "Preparar anulación completa" }));
		expect(callbacks.onStartVoid).toHaveBeenCalledOnce();
	});

	it("explica una venta no elegible y no ofrece anulación", () => {
		vi.mocked(useSaleDetail).mockReturnValue({
			...sale,
			cashSessionStatus: "closed",
			voidEligibility: { eligible: false, reason: "CASH_SESSION_CLOSED" },
		});
		render(<SaleHistorySheet saleId="sale-1" mode="detail" {...callbacks} />);
		expect(screen.getByText("Anulación no disponible")).toBeVisible();
		expect(screen.queryByRole("button", { name: "Preparar anulación completa" })).toBeNull();
	});

	it("anuncia y reconstruye el resultado persistido", () => {
		vi.mocked(useSaleDetail).mockReturnValue({
			...sale,
			status: "voided",
			voidedAt: result.voidedAt,
			voidReason: result.reason,
			voidEligibility: { eligible: false, reason: "SALE_ALREADY_VOIDED" },
		});
		vi.mocked(useSaleVoidResult).mockReturnValue(result);
		render(<SaleHistorySheet saleId="sale-1" mode="void-result" {...callbacks} />);
		expect(screen.getByRole("heading", { name: "Venta anulada" })).toBeVisible();
		expect(screen.getByText("V-000001 fue anulada")).toBeVisible();
		expect(screen.getByText(/Se restauraron 1 unidades/)).toBeVisible();
	});
});
