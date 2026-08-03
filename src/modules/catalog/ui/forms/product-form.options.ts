import { formOptions } from "@tanstack/react-form";
import { productFormSchema } from "./product-form.schema";
import type { ProductFormValues } from "./product-form.types";

export const productFormDefaultValues: ProductFormValues = {
	name: "",
	barcode: "",
	categoryId: "",
	salePrice: "",
	costPrice: "",
	minimumStockQuantity: "0",
};

export const productFormOptions = formOptions({
	defaultValues: productFormDefaultValues,
	validators: { onSubmit: productFormSchema },
});
