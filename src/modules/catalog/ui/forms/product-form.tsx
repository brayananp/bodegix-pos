import { useAppForm } from "@/shared/ui/forms";
import { useState } from "react";
import { toast } from "sonner";
import { type CatalogStore, createProduct, updateProduct } from "../../application";
import { type Category, isCatalogError, type Product } from "../../domain";
import { getCatalogStore } from "../../infrastructure";
import { ProductFormFields } from "./product-form-fields";
import {
	createEmptyProductFormValues,
	productFormValuesToCreateInput,
	productFormValuesToUpdateInput,
	productToFormValues,
} from "./product-form.mappers";
import { productFormOptions } from "./product-form.options";

interface ProductFormProps {
	product?: Product;
	categories: Category[];
	onCancel(): void;
	onSuccess(product: Product): void | Promise<void>;
	store?: CatalogStore;
}

export function ProductForm({ product, categories, onCancel, onSuccess, store }: ProductFormProps) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...productFormOptions,
		defaultValues: product ? productToFormValues(product) : createEmptyProductFormValues(),
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const catalogStore = store ?? getCatalogStore();
				const saved = product
					? await updateProduct(catalogStore, productFormValuesToUpdateInput(product.id, value))
					: await createProduct(catalogStore, productFormValuesToCreateInput(value));
				form.reset(value);
				toast.success(product ? "Producto actualizado" : "Producto creado");
				await onSuccess(saved);
			} catch (error) {
				if (isCatalogError(error) && error.code === "PRODUCT_BARCODE_ALREADY_EXISTS") {
					form.setFieldMeta("barcode", (meta) => ({
						...meta,
						isTouched: true,
						errorMap: { ...meta.errorMap, onSubmit: error.message },
					}));
					return;
				}
				if (
					isCatalogError(error) &&
					(error.code === "CATEGORY_INACTIVE" || error.code === "CATEGORY_NOT_FOUND")
				) {
					form.setFieldMeta("categoryId", (meta) => ({
						...meta,
						isTouched: true,
						errorMap: { ...meta.errorMap, onSubmit: error.message },
					}));
					return;
				}
				setFormError(
					isCatalogError(error) ? error.message : "Ocurrió un error inesperado al guardar.",
				);
			}
		},
	});

	return (
		<form
			className="flex min-h-0 flex-1 flex-col"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.AppForm>
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
					<ProductFormFields
						form={form}
						categories={categories.filter(
							(category) => category.isActive || category.id === product?.categoryId,
						)}
						stockQuantity={product?.stockQuantity ?? 0}
					/>
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<footer className="shrink-0 border-t bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
					<div className="mb-2 flex min-h-4 items-center">
						<form.DirtyStateIndicator />
					</div>
					<form.FormActions
						onCancel={onCancel}
						submitLabel={product ? "Guardar cambios" : "Crear producto"}
					/>
				</footer>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
