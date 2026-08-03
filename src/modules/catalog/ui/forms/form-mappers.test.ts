import { describe, expect, it } from "vitest";
import type { Category, Product } from "../../domain";
import {
	categoryFormValuesToCreateInput,
	categoryToFormValues,
	createEmptyCategoryFormValues,
} from "./category-form.mappers";
import {
	createEmptyProductFormValues,
	productFormValuesToCreateInput,
	productFormValuesToUpdateInput,
	productToFormValues,
} from "./product-form.mappers";

const product: Product = {
	id: "product-1",
	name: "Leche",
	normalizedName: "leche",
	barcode: "00123",
	categoryId: "category-1",
	salePriceCents: 450,
	costPriceCents: null,
	stockQuantity: 8,
	minimumStockQuantity: 2,
	isActive: true,
	createdAt: 1,
	updatedAt: 2,
};

describe("mapeadores de formularios del catálogo", () => {
	it("crea valores vacíos estables separados del dominio", () => {
		expect(createEmptyProductFormValues()).toEqual({
			name: "",
			barcode: "",
			categoryId: "",
			salePrice: "",
			costPrice: "",
			minimumStockQuantity: "0",
		});
		expect(createEmptyCategoryFormValues()).toEqual({ name: "" });
	});

	it("convierte dinero exacto, vacíos a null y conserva ceros del código", () => {
		expect(
			productFormValuesToCreateInput({
				name: "  Leche evaporada  ",
				barcode: "00123",
				categoryId: "",
				salePrice: "3,50",
				costPrice: "",
				minimumStockQuantity: "4",
			}),
		).toEqual({
			name: "Leche evaporada",
			barcode: "00123",
			categoryId: null,
			salePriceCents: 350,
			costPriceCents: null,
			minimumStockQuantity: 4,
		});
	});

	it("carga edición sin mutar ni reutilizar la entidad anterior", () => {
		const values = productToFormValues(product);
		expect(values).toEqual({
			name: "Leche",
			barcode: "00123",
			categoryId: "category-1",
			salePrice: "4.50",
			costPrice: "",
			minimumStockQuantity: "2",
		});
		values.name = "Otro";
		expect(product.name).toBe("Leche");
		expect(productFormValuesToUpdateInput(product.id, productToFormValues(product)).productId).toBe(
			"product-1",
		);
	});

	it("mapea categorías mediante valores propios del formulario", () => {
		const category: Category = {
			id: "category-1",
			name: "Bebidas",
			normalizedName: "bebidas",
			isActive: true,
			createdAt: 1,
			updatedAt: 1,
		};
		expect(categoryToFormValues(category)).toEqual({ name: "Bebidas" });
		expect(categoryFormValuesToCreateInput({ name: "  Abarrotes  " })).toEqual({
			name: "Abarrotes",
		});
	});
});
