import { FieldGroup } from "@/shared/components/ui/field";
import { withForm } from "@/shared/ui/forms";
import type { Category } from "../../domain";
import { productFormOptions } from "./product-form.options";
import { productFormSchema } from "./product-form.schema";

export const ProductFormFields = withForm({
	...productFormOptions,
	props: { categories: [] as Category[], stockQuantity: 0 },
	render: function Render({ form, categories, stockQuantity }) {
		return (
			<FieldGroup className="gap-5">
				<form.AppField name="name" validators={{ onBlur: productFormSchema.shape.name }}>
					{(field) => (
						<field.TextField label="Nombre" autoComplete="off" autoFocus maxLength={120} />
					)}
				</form.AppField>
				<form.AppField name="barcode" validators={{ onBlur: productFormSchema.shape.barcode }}>
					{(field) => (
						<field.BarcodeField
							label="Código de barras"
							description="Opcional. Conserva ceros iniciales y admite códigos alfanuméricos."
							autoComplete="off"
							maxLength={64}
						/>
					)}
				</form.AppField>
				<form.AppField name="categoryId">
					{(field) => (
						<field.SelectField
							label="Categoría"
							emptyLabel="Sin categoría"
							options={categories.map((category) => ({
								value: category.id,
								label: category.isActive ? category.name : `${category.name} (inactiva)`,
							}))}
						/>
					)}
				</form.AppField>
				<div className="grid gap-5 sm:grid-cols-2">
					<form.AppField
						name="salePrice"
						validators={{ onBlur: productFormSchema.shape.salePrice }}
					>
						{(field) => <field.MoneyField label="Precio de venta" placeholder="0.00" />}
					</form.AppField>
					<form.AppField
						name="costPrice"
						validators={{ onBlur: productFormSchema.shape.costPrice }}
					>
						{(field) => <field.MoneyField label="Costo" placeholder="0.00" />}
					</form.AppField>
				</div>
				<form.AppField
					name="minimumStockQuantity"
					validators={{ onBlur: productFormSchema.shape.minimumStockQuantity }}
				>
					{(field) => (
						<field.IntegerField
							label="Stock mínimo"
							description="Se usará como referencia en la futura gestión de inventario."
							minimum={0}
						/>
					)}
				</form.AppField>
				<div className="rounded-lg border border-dashed bg-muted/30 p-4">
					<p className="text-sm font-medium">Stock actual: {stockQuantity}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						El stock se administra desde Inventario.
					</p>
				</div>
			</FieldGroup>
		);
	},
});
