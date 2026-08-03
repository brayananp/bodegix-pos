import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import { formatMoney } from "@/shared/kernel/money";
import type { ProductListItem, ProductSearchResult } from "../../application";
import { CatalogEmptyState } from "./catalog-empty-state";

interface ProductListProps {
	result: ProductSearchResult;
	onView(product: ProductListItem): void;
	onEdit(product: ProductListItem): void;
	onToggleActive(product: ProductListItem): void;
	onCreate(): void;
	onPageChange(page: number): void;
}

function ProductActions({
	product,
	onView,
	onEdit,
	onToggleActive,
}: Omit<ProductListProps, "result" | "onCreate" | "onPageChange"> & {
	product: ProductListItem;
}) {
	return (
		<div className="flex flex-wrap items-center justify-end gap-1">
			<Button size="sm" variant="ghost" onClick={() => onView(product)}>
				Ver
			</Button>
			<Button size="sm" variant="ghost" onClick={() => onEdit(product)}>
				Editar
			</Button>
			<Button
				size="sm"
				variant={product.isActive ? "destructive" : "outline"}
				onClick={() => onToggleActive(product)}
			>
				{product.isActive ? "Desactivar" : "Reactivar"}
			</Button>
		</div>
	);
}

export function ProductList(props: ProductListProps) {
	const { result } = props;
	if (result.items.length === 0) {
		return (
			<CatalogEmptyState
				title="No hay productos para mostrar"
				description="Ajusta los filtros o registra el primer producto del catálogo."
			/>
		);
	}
	return (
		<div className="grid gap-4">
			<div className="hidden overflow-hidden rounded-xl border bg-card md:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Producto</TableHead>
							<TableHead>Categoría</TableHead>
							<TableHead className="text-right">Precio</TableHead>
							<TableHead className="text-right">Stock</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead className="text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{result.items.map((product) => (
							<TableRow key={product.id}>
								<TableCell>
									<button
										type="button"
										className="min-h-11 text-left focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring"
										onClick={() => props.onView(product)}
									>
										<span className="block font-medium">{product.name}</span>
										{product.barcode && (
											<span className="block font-mono text-xs text-muted-foreground">
												{product.barcode}
											</span>
										)}
									</button>
								</TableCell>
								<TableCell>{product.categoryName ?? "Sin categoría"}</TableCell>
								<TableCell className="text-right font-medium">
									{formatMoney(product.salePriceCents)}
								</TableCell>
								<TableCell className="text-right tabular-nums">{product.stockQuantity}</TableCell>
								<TableCell>
									<Badge variant={product.isActive ? "secondary" : "outline"}>
										{product.isActive ? "Activo" : "Inactivo"}
									</Badge>
								</TableCell>
								<TableCell>
									<ProductActions product={product} {...props} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="grid gap-3 md:hidden">
				{result.items.map((product) => (
					<article key={product.id} className="rounded-xl border bg-card p-4 shadow-xs">
						<div className="flex items-start justify-between gap-3">
							<button
								type="button"
								className="min-h-11 flex-1 text-left"
								onClick={() => props.onView(product)}
							>
								<h3 className="font-heading font-semibold">{product.name}</h3>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{product.categoryName ?? "Sin categoría"}
									{product.barcode ? ` · ${product.barcode}` : ""}
								</p>
							</button>
							<Badge variant={product.isActive ? "secondary" : "outline"}>
								{product.isActive ? "Activo" : "Inactivo"}
							</Badge>
						</div>
						<div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-sm">
							<div>
								<span className="block text-xs text-muted-foreground">Precio</span>
								<strong>{formatMoney(product.salePriceCents)}</strong>
							</div>
							<div>
								<span className="block text-xs text-muted-foreground">Stock</span>
								<strong>{product.stockQuantity}</strong>
							</div>
						</div>
						<div className="mt-3">
							<ProductActions product={product} {...props} />
						</div>
					</article>
				))}
			</div>

			<div className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
				<p className="text-muted-foreground">
					{result.total} producto{result.total === 1 ? "" : "s"} · Página {result.page} de{" "}
					{result.totalPages}
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						disabled={result.page <= 1}
						onClick={() => props.onPageChange(result.page - 1)}
					>
						Anterior
					</Button>
					<Button
						variant="outline"
						disabled={result.page >= result.totalPages}
						onClick={() => props.onPageChange(result.page + 1)}
					>
						Siguiente
					</Button>
				</div>
			</div>
		</div>
	);
}
