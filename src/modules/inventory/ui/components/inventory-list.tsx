import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import type { InventoryProduct, InventorySearchResult } from "../../application";
import { InventoryStatusBadge } from "./inventory-status-badge";

interface InventoryListProps {
	result: InventorySearchResult;
	onView(product: InventoryProduct): void;
	onPageChange(page: number): void;
}

function dateLabel(timestamp: number | null): string {
	if (timestamp === null) return "Sin movimientos";
	return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(
		timestamp,
	);
}

export function InventoryList({ result, onView, onPageChange }: InventoryListProps) {
	if (result.items.length === 0) {
		return (
			<Empty className="min-h-56 rounded-xl border border-dashed">
				<EmptyHeader>
					<EmptyTitle>Sin productos para estos filtros</EmptyTitle>
					<EmptyDescription>
						Prueba otra búsqueda o registra productos desde Catálogo.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
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
							<TableHead className="text-right">Stock</TableHead>
							<TableHead className="text-right">Mínimo</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead>Último movimiento</TableHead>
							<TableHead className="text-right">Acción</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{result.items.map((product) => (
							<TableRow key={product.id}>
								<TableCell>
									<button
										type="button"
										className="min-h-11 text-left focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring"
										onClick={() => onView(product)}
									>
										<span className="block font-medium">{product.name}</span>
										{product.barcode && (
											<span className="font-mono text-xs text-muted-foreground">
												{product.barcode}
											</span>
										)}
									</button>
								</TableCell>
								<TableCell>{product.categoryName ?? "Sin categoría"}</TableCell>
								<TableCell className="text-right font-heading text-xl font-semibold tabular-nums">
									{product.stockQuantity}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{product.minimumStockQuantity}
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										<InventoryStatusBadge status={product.stockStatus} />
										{!product.isActive && <Badge variant="outline">Inactivo</Badge>}
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{dateLabel(product.lastMovementAt)}
								</TableCell>
								<TableCell className="text-right">
									<Button size="sm" variant="outline" onClick={() => onView(product)}>
										Ver inventario
									</Button>
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
								onClick={() => onView(product)}
							>
								<h3 className="font-heading font-semibold">{product.name}</h3>
								<p className="text-xs text-muted-foreground">
									{product.categoryName ?? "Sin categoría"}
									{product.barcode ? ` · ${product.barcode}` : ""}
								</p>
							</button>
							<InventoryStatusBadge status={product.stockStatus} />
						</div>
						<div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center">
							<span>
								<small className="block text-muted-foreground">Actual</small>
								<strong className="font-heading text-2xl tabular-nums">
									{product.stockQuantity}
								</strong>
							</span>
							<span>
								<small className="block text-muted-foreground">Mínimo</small>
								<strong className="font-heading text-2xl tabular-nums">
									{product.minimumStockQuantity}
								</strong>
							</span>
							<span>
								<small className="block text-muted-foreground">Historial</small>
								<strong>{product.hasInventoryMovements ? "Sí" : "No"}</strong>
							</span>
						</div>
						<div className="mt-3 flex items-center justify-between gap-2">
							<span className="text-xs text-muted-foreground">
								{dateLabel(product.lastMovementAt)}
							</span>
							<Button size="sm" variant="outline" onClick={() => onView(product)}>
								Ver
							</Button>
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
						onClick={() => onPageChange(result.page - 1)}
					>
						Anterior
					</Button>
					<Button
						variant="outline"
						disabled={result.page >= result.totalPages}
						onClick={() => onPageChange(result.page + 1)}
					>
						Siguiente
					</Button>
				</div>
			</div>
		</div>
	);
}
