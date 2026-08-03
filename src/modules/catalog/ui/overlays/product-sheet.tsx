import { Button } from "@/shared/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import type { Category, Product } from "../../domain";
import type { ProductPanelMode } from "../catalog-search";
import { ProductForm } from "../forms/product-form";
import { ProductDetail } from "./product-detail";

interface ProductSheetProps {
	mode: ProductPanelMode;
	product: Product | null | undefined;
	categories: Category[];
	onClose(): void;
	onEdit(): void;
	onSaved(product: Product): void | Promise<void>;
	onToggleActive(product: Product): void;
}

export function ProductSheet({
	mode,
	product,
	categories,
	onClose,
	onEdit,
	onSaved,
	onToggleActive,
}: ProductSheetProps) {
	const title =
		mode === "create"
			? "Nuevo producto"
			: mode === "edit"
				? "Editar producto"
				: "Detalle del producto";
	return (
		<Sheet
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<SheetContent
				side="right"
				showCloseButton={false}
				className="h-dvh w-full max-w-none gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[640px]"
			>
				<SheetHeader className="shrink-0 border-b pr-4 md:px-6">
					<div className="flex items-start justify-between gap-3">
						<div>
							<SheetTitle>{title}</SheetTitle>
							<SheetDescription>
								{mode === "detail"
									? "Consulta la información vigente del catálogo."
									: "Completa los datos comerciales. El stock no se modifica aquí."}
							</SheetDescription>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							Cerrar
						</Button>
					</div>
				</SheetHeader>
				{mode === "create" ? (
					<ProductForm
						key="product-create"
						categories={categories}
						onCancel={onClose}
						onSuccess={onSaved}
					/>
				) : product === undefined ? (
					<div className="p-6 text-sm text-muted-foreground">Cargando producto…</div>
				) : product === null ? null : mode === "edit" ? (
					<ProductForm
						key={product.id}
						product={product}
						categories={categories}
						onCancel={onClose}
						onSuccess={onSaved}
					/>
				) : (
					<ProductDetail
						product={product}
						category={categories.find(({ id }) => id === product.categoryId)}
						onEdit={onEdit}
						onToggleActive={() => onToggleActive(product)}
						onClose={onClose}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}
