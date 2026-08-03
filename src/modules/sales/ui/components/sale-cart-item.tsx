import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatMoney } from "@/shared/kernel/money";
import type { SaleDraftItem } from "../../domain";

interface SaleCartItemProps {
	item: SaleDraftItem;
	productName: string;
	stock: number;
	onQuantityChange(productId: string, qty: number): void;
	onRemove(productId: string): void;
}

export function SaleCartItem({
	item,
	productName,
	stock,
	onQuantityChange,
	onRemove,
}: SaleCartItemProps) {
	const subtotal = item.expectedUnitPriceCents * item.quantity;

	return (
		<li className="flex items-start gap-3 py-2">
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium leading-tight truncate">{productName}</p>
				<p className="text-xs text-muted-foreground">
					{formatMoney(item.expectedUnitPriceCents)} c/u
				</p>
			</div>

			<div className="flex items-center gap-1 shrink-0">
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="h-7 w-7"
					onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
					aria-label={`Reducir cantidad de ${productName}`}
				>
					–
				</Button>
				<Input
					type="number"
					min={1}
					max={stock}
					value={item.quantity}
					onChange={(e) => {
						const val = Number.parseInt(e.target.value, 10);
						if (!Number.isNaN(val)) onQuantityChange(item.productId, val);
					}}
					className="h-7 w-12 text-center px-1"
					aria-label={`Cantidad de ${productName}`}
				/>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="h-7 w-7"
					onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
					disabled={item.quantity >= stock}
					aria-label={`Aumentar cantidad de ${productName}`}
				>
					+
				</Button>
			</div>

			<div className="shrink-0 text-right min-w-[70px]">
				<p className="text-sm font-semibold">{formatMoney(subtotal)}</p>
				<button
					type="button"
					className="text-xs text-muted-foreground hover:text-destructive transition-colors"
					onClick={() => onRemove(item.productId)}
					aria-label={`Eliminar ${productName} del carrito`}
				>
					Eliminar
				</button>
			</div>
		</li>
	);
}
