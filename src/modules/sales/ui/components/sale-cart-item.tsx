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
		<li className="space-y-2.5 py-3">
			<div className="flex items-start justify-between gap-3">
				<p className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug">
					{productName}
				</p>
				<p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(subtotal)}</p>
			</div>

			<div className="flex items-center justify-between gap-2">
				<p className="shrink-0 text-xs text-muted-foreground tabular-nums">
					{formatMoney(item.expectedUnitPriceCents)} c/u
				</p>

				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
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
						className="h-8 w-12 px-1 text-center tabular-nums"
						aria-label={`Cantidad de ${productName}`}
					/>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
						disabled={item.quantity >= stock}
						aria-label={`Aumentar cantidad de ${productName}`}
					>
						+
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="xs"
						className="text-muted-foreground hover:text-destructive"
						onClick={() => onRemove(item.productId)}
						aria-label={`Eliminar ${productName} del carrito`}
					>
						Eliminar
					</Button>
				</div>
			</div>
		</li>
	);
}
