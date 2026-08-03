import type { Category } from "../../domain";
import { CategoryForm } from "../forms/category-form";
import { ResponsiveDialogDrawer } from "./responsive-dialog-drawer";

interface CategoryDialogDrawerProps {
	mode: "create" | "edit";
	category?: Category;
	onClose(): void;
	onSuccess(category: Category): void | Promise<void>;
}

export function CategoryDialogDrawer({
	mode,
	category,
	onClose,
	onSuccess,
}: CategoryDialogDrawerProps) {
	const isEdit = mode === "edit";
	return (
		<ResponsiveDialogDrawer
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			title={isEdit ? "Editar categoría" : "Nueva categoría"}
			description="Organiza los productos sin perder el historial del catálogo."
		>
			{isEdit && !category ? (
				<div className="p-6 text-sm text-muted-foreground">Cargando categoría…</div>
			) : (
				<CategoryForm
					key={category?.id ?? "category-create"}
					{...(category ? { category } : {})}
					onCancel={onClose}
					onSuccess={onSuccess}
				/>
			)}
		</ResponsiveDialogDrawer>
	);
}
