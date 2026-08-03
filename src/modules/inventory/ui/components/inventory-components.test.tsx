import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InventoryStatusBadge } from "./inventory-status-badge";
import { InventorySummary } from "./inventory-summary";
import { StockTransitionPreview } from "./stock-transition-preview";

describe("componentes de inventario", () => {
	it.each([
		["in_stock", "Con stock"],
		["low_stock", "Stock bajo"],
		["out_of_stock", "Agotado"],
	] as const)("expresa el estado %s también mediante texto", (status, label) => {
		render(<InventoryStatusBadge status={status} />);
		expect(screen.getByText(label)).toBeVisible();
	});

	it("muestra las métricas operativas sin calcular valores monetarios", () => {
		render(
			<InventorySummary
				summary={{
					activeProducts: 9,
					productsInStock: 4,
					lowStockProducts: 2,
					outOfStockProducts: 3,
					productsWithoutMovements: 1,
				}}
			/>,
		);
		const summary = screen.getByRole("region", { name: "Resumen de inventario" });
		expect(within(summary).getByText("Con stock").parentElement).toHaveTextContent("4");
		expect(within(summary).getByText("Stock bajo").parentElement).toHaveTextContent("2");
		expect(within(summary).getByText("Agotados").parentElement).toHaveTextContent("3");
		expect(within(summary).getByText("Sin inicializar").parentElement).toHaveTextContent("1");
		expect(summary).not.toHaveTextContent(/valor|utilidad|costo/i);
	});

	it("explica una transición con signo y saldos antes/después", () => {
		render(
			<StockTransitionPreview
				label="Resultado del conteo"
				currentStock={15}
				quantityDelta={-3}
				stockAfter={12}
			/>,
		);
		expect(screen.getByText("Resultado del conteo")).toBeVisible();
		expect(screen.getByText("15")).toBeVisible();
		expect(screen.getByText("-3")).toBeVisible();
		expect(screen.getByText("12")).toBeVisible();
	});
});
