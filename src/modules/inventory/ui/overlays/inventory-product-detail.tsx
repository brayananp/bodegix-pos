import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import type { InventoryMovementSearchResult, InventoryProduct } from "../../application";
import type { InventoryPanelMode } from "../inventory-search";
import { movementLabels } from "../components/inventory-movement-list";
import { InventoryStatusBadge } from "../components/inventory-status-badge";

interface InventoryProductDetailProps {
	product: InventoryProduct;
	movements: InventoryMovementSearchResult | undefined;
	onMode(mode: Exclude<InventoryPanelMode, "detail">): void;
	onClose(): void;
}

export function InventoryProductDetail({
	product,
	movements,
	onMode,
	onClose,
}: InventoryProductDetailProps) {
	const canInitialize =
		product.stockQuantity === 0 && !product.hasInventoryMovements && product.isActive;
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
				<div className="grid gap-5">
					<Card>
						<CardHeader>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<CardTitle>{product.name}</CardTitle>
									<CardDescription>
										{product.categoryName ?? "Sin categoría"}
										{product.barcode ? ` · ${product.barcode}` : ""}
									</CardDescription>
								</div>
								<div className="flex flex-wrap gap-1">
									<InventoryStatusBadge status={product.stockStatus} />
									<Badge variant={product.isActive ? "secondary" : "outline"}>
										{product.isActive ? "Activo" : "Inactivo"}
									</Badge>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-lg bg-muted/40 p-4 text-center">
									<span className="block text-xs text-muted-foreground">Stock actual</span>
									<strong className="font-heading text-4xl tabular-nums">
										{product.stockQuantity}
									</strong>
								</div>
								<div className="rounded-lg bg-muted/40 p-4 text-center">
									<span className="block text-xs text-muted-foreground">Stock mínimo</span>
									<strong className="font-heading text-4xl tabular-nums">
										{product.minimumStockQuantity}
									</strong>
								</div>
							</div>
						</CardContent>
					</Card>
					<div className="grid gap-2 sm:grid-cols-2">
						{canInitialize && (
							<Button onClick={() => onMode("initial")}>Registrar stock inicial</Button>
						)}
						{product.isActive && (
							<Button
								variant={canInitialize ? "outline" : "default"}
								onClick={() => onMode("entry")}
							>
								Registrar entrada
							</Button>
						)}
						<Button variant="outline" onClick={() => onMode("reconcile")}>
							Ajustar por conteo
						</Button>
						{product.stockQuantity > 0 && (
							<Button variant="destructive" onClick={() => onMode("loss")}>
								Registrar pérdida
							</Button>
						)}
					</div>
					<Separator />
					<section aria-labelledby="recent-movements" className="grid gap-3">
						<div>
							<h3 id="recent-movements" className="font-heading font-semibold">
								Movimientos recientes
							</h3>
							<p className="text-sm text-muted-foreground">
								Últimos cambios confirmados para este producto.
							</p>
						</div>
						{movements === undefined ? (
							<p className="text-sm text-muted-foreground">Cargando historial…</p>
						) : movements.items.length === 0 ? (
							<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
								Aún no existen movimientos.
							</p>
						) : (
							<ol className="grid gap-2">
								{movements.items.slice(0, 5).map((movement) => (
									<li
										key={movement.id}
										className="flex items-center justify-between gap-3 rounded-lg border p-3"
									>
										<div>
											<p className="font-medium">{movementLabels[movement.type]}</p>
											<p className="text-xs text-muted-foreground">
												{new Intl.DateTimeFormat("es-PE", {
													dateStyle: "medium",
													timeStyle: "short",
												}).format(movement.createdAt)}
											</p>
										</div>
										<div className="text-right">
											<strong className="font-heading text-lg tabular-nums">
												{movement.quantityDelta > 0 ? "+" : ""}
												{movement.quantityDelta}
											</strong>
											<p className="text-xs text-muted-foreground">
												{movement.stockBefore} → {movement.stockAfter}
											</p>
										</div>
									</li>
								))}
							</ol>
						)}
					</section>
				</div>
			</div>
			<footer className="shrink-0 border-t bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
				<Button className="w-full sm:w-auto" variant="outline" onClick={onClose}>
					Cerrar
				</Button>
			</footer>
		</div>
	);
}
