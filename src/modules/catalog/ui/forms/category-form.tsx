import { useState } from "react";
import { toast } from "sonner";
import { FieldGroup } from "@/shared/components/ui/field";
import { useAppForm } from "@/shared/ui/forms";
import { createCategory, updateCategory, type CatalogStore } from "../../application";
import { isCatalogError, type Category } from "../../domain";
import { getCatalogStore } from "../../infrastructure";
import {
	categoryFormValuesToCreateInput,
	categoryFormValuesToUpdateInput,
	categoryToFormValues,
	createEmptyCategoryFormValues,
} from "./category-form.mappers";
import { categoryFormOptions } from "./category-form.options";
import { categoryFormSchema } from "./category-form.schema";

interface CategoryFormProps {
	category?: Category;
	onCancel(): void;
	onSuccess(category: Category): void | Promise<void>;
	store?: CatalogStore;
}

export function CategoryForm({ category, onCancel, onSuccess, store }: CategoryFormProps) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...categoryFormOptions,
		defaultValues: category ? categoryToFormValues(category) : createEmptyCategoryFormValues(),
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const catalogStore = store ?? getCatalogStore();
				const saved = category
					? await updateCategory(catalogStore, categoryFormValuesToUpdateInput(category.id, value))
					: await createCategory(catalogStore, categoryFormValuesToCreateInput(value));
				form.reset(value);
				toast.success(category ? "Categoría actualizada" : "Categoría creada");
				await onSuccess(saved);
			} catch (error) {
				if (isCatalogError(error) && error.code === "CATEGORY_NAME_ALREADY_EXISTS") {
					form.setFieldMeta("name", (meta) => ({
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
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-0">
					<FieldGroup>
						<form.AppField name="name" validators={{ onBlur: categoryFormSchema.shape.name }}>
							{(field) => (
								<field.TextField label="Nombre" autoComplete="off" autoFocus maxLength={60} />
							)}
						</form.AppField>
					</FieldGroup>
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<div className="border-t px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:border-0 sm:px-0 sm:pb-0">
					<div className="mb-2 min-h-4">
						<form.DirtyStateIndicator />
					</div>
					<form.FormActions
						onCancel={onCancel}
						submitLabel={category ? "Guardar cambios" : "Crear categoría"}
					/>
				</div>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
