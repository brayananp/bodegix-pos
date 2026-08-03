import { Button } from "@/shared/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import type { InventoryProduct } from "../../application";
import { InitialStockForm } from "../forms/initial-stock-form";
import { StockEntryForm } from "../forms/stock-entry-form";
import { StockLossForm } from "../forms/stock-loss-form";
import { StockReconciliationForm } from "../forms/stock-reconciliation-form";
import { useProductInventoryMovements } from "../hooks/use-inventory-queries";
import type { InventoryPanelMode } from "../inventory-search";
import { InventoryProductDetail } from "./inventory-product-detail";

const titles: Record<InventoryPanelMode, string> = {
	detail: "Detalle de inventario",
	initial: "Registrar stock inicial",
	entry: "Registrar entrada",
	reconcile: "Ajustar por conteo",
	loss: "Registrar pérdida",
};

interface InventorySheetProps {
	mode: InventoryPanelMode;
	product: InventoryProduct | null | undefined;
	onClose(): void;
	onMode(mode: InventoryPanelMode): void;
}

export function InventorySheet({ mode, product, onClose, onMode }: InventorySheetProps) {
	const movements = useProductInventoryMovements(product?.id ?? null);
	const cancelOperation = () => onMode("detail");
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
							<SheetTitle>{titles[mode]}</SheetTitle>
							<SheetDescription>
								{mode === "detail"
									? "Consulta el saldo y su historial auditable."
									: "El saldo y el movimiento se guardarán juntos de forma atómica."}
							</SheetDescription>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							Cerrar
						</Button>
					</div>
				</SheetHeader>
				{product === undefined ? (
					<div className="p-6 text-sm text-muted-foreground">Cargando inventario…</div>
				) : product === null ? null : mode === "detail" ? (
					<InventoryProductDetail
						product={product}
						movements={movements}
						onMode={onMode}
						onClose={onClose}
					/>
				) : mode === "initial" ? (
					<InitialStockForm
						key={`${product.id}-initial`}
						productId={product.id}
						currentStock={product.stockQuantity}
						onCancel={cancelOperation}
						onSuccess={() => onMode("detail")}
					/>
				) : mode === "entry" ? (
					<StockEntryForm
						key={`${product.id}-entry`}
						productId={product.id}
						currentStock={product.stockQuantity}
						onCancel={cancelOperation}
						onSuccess={() => onMode("detail")}
					/>
				) : mode === "reconcile" ? (
					<StockReconciliationForm
						key={`${product.id}-reconcile`}
						productId={product.id}
						currentStock={product.stockQuantity}
						onCancel={cancelOperation}
						onSuccess={() => onMode("detail")}
					/>
				) : (
					<StockLossForm
						key={`${product.id}-loss`}
						productId={product.id}
						currentStock={product.stockQuantity}
						onCancel={cancelOperation}
						onSuccess={() => onMode("detail")}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}
