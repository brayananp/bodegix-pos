import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SaleProductListItem } from "../../application";
import { SaleProductCard } from "./sale-product-card";

const product: SaleProductListItem = {
	id: "product-1",
	name: "Aceite Primor 1 L",
	barcode: "7750243001238",
	categoryId: "category-1",
	categoryName: "Abarrotes",
	salePriceCents: 1_050,
	stockQuantity: 7,
	isActive: true,
	canSell: true,
};

describe("SaleProductCard", () => {
	it("prioriza la información operativa y agrega el producto con toda la tarjeta", async () => {
		const onAdd = vi.fn();
		render(<SaleProductCard product={product} cartQuantity={2} onAdd={onAdd} />);

		const button = screen.getByRole("button", {
			name: /agregar aceite primor 1 l al carrito.*s\/\s10\.50.*stock 7/i,
		});
		expect(button).toHaveClass("w-full", "h-full");
		expect(screen.getByText("Abarrotes")).toBeVisible();
		expect(screen.getByText("7750243001238")).toBeVisible();
		expect(screen.getByText("7 uds")).toBeVisible();
		expect(screen.getByLabelText("2 en el carrito")).toBeVisible();

		await userEvent.click(button);
		expect(onAdd).toHaveBeenCalledOnce();
		expect(onAdd).toHaveBeenCalledWith(product);
	});

	it("explica el estado agotado y no permite agregarlo", async () => {
		const onAdd = vi.fn();
		render(
			<SaleProductCard product={{ ...product, stockQuantity: 0, canSell: false }} onAdd={onAdd} />,
		);

		const button = screen.getByRole("button", {
			name: /aceite primor 1 l, agotado, no disponible para la venta/i,
		});
		expect(button).toBeDisabled();
		expect(screen.getByText("Agotado")).toBeVisible();

		await userEvent.click(button);
		expect(onAdd).not.toHaveBeenCalled();
	});
});
