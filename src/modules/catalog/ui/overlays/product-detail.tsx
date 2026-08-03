import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatMoney } from "@/shared/kernel/money";
import type { Category, Product } from "../../domain";

function formatTimestamp(timestamp: number): string {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(new Date(timestamp));
}

export function ProductDetail({
	product,
	category,
	onEdit,
	onToggleActive,
	onClose,
}: {
	product: Product;
	category: Category | undefined;
	onEdit(): void;
	onToggleActive(): void;
	onClose(): void;
}) {
	const details = [
		["Código de barras", product.barcode ?? "Sin código"],
		["Categoría", category?.name ?? "Sin categoría"],
		["Precio de venta", formatMoney(product.salePriceCents)],
		[
			"Costo",
			product.costPriceCents === null ? "No registrado" : formatMoney(product.costPriceCents),
		],
		["Stock actual", String(product.stockQuantity)],
		["Stock mínimo", String(product.minimumStockQuantity)],
		["Creado", formatTimestamp(product.createdAt)],
		["Última actualización", formatTimestamp(product.updatedAt)],
	] as const;
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
				<div className="mb-5 flex items-start justify-between gap-3 rounded-xl border bg-muted/25 p-4">
					<div>
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Producto
						</p>
						<h3 className="mt-1 font-heading text-xl font-semibold">{product.name}</h3>
					</div>
					<Badge variant={product.isActive ? "secondary" : "outline"}>
						{product.isActive ? "Activo" : "Inactivo"}
					</Badge>
				</div>
				<dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
					{details.map(([label, value]) => (
						<div key={label} className="bg-card p-4">
							<dt className="text-xs text-muted-foreground">{label}</dt>
							<dd className="mt-1 font-medium">{value}</dd>
						</div>
					))}
				</dl>
				<div className="mt-4 rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
					El stock es de solo lectura. Se administrará desde Inventario en la siguiente fase.
				</div>
			</div>
			<footer className="flex shrink-0 flex-col-reverse gap-2 border-t bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end md:px-6">
				<Button variant="outline" onClick={onClose}>
					Cerrar
				</Button>
				<Button variant={product.isActive ? "destructive" : "outline"} onClick={onToggleActive}>
					{product.isActive ? "Desactivar" : "Reactivar"}
				</Button>
				<Button onClick={onEdit}>Editar producto</Button>
			</footer>
		</div>
	);
}
