import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaleCartItem } from "./sale-cart-item";

const item = {
	productId: "product-1",
	quantity: 2,
	expectedUnitPriceCents: 480,
};

describe("SaleCartItem", () => {
	it("muestra el nombre completo y conserva controles rápidos de venta", async () => {
		const onQuantityChange = vi.fn();
		const onRemove = vi.fn();
		const productName = "Leche Gloria entera 1 L";

		render(
			<SaleCartItem
				item={item}
				productName={productName}
				stock={9}
				onQuantityChange={onQuantityChange}
				onRemove={onRemove}
			/>,
		);

		const name = screen.getByText(productName);
		expect(name).toBeVisible();
		expect(name).toHaveClass("break-words");
		expect(name).not.toHaveClass("truncate");
		expect(screen.getByText("S/ 9.60")).toBeVisible();

		await userEvent.click(
			screen.getByRole("button", { name: `Aumentar cantidad de ${productName}` }),
		);
		expect(onQuantityChange).toHaveBeenCalledWith("product-1", 3);

		await userEvent.click(
			screen.getByRole("button", { name: `Eliminar ${productName} del carrito` }),
		);
		expect(onRemove).toHaveBeenCalledWith("product-1");
	});
});
