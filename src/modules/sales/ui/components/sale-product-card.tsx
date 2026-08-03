import { Badge } from "@/shared/components/ui/badge";
import { formatMoney } from "@/shared/kernel/money";
import type { SaleProductListItem } from "../../application";

interface SaleProductCardProps {
	product: SaleProductListItem;
	cartQuantity?: number;
	onAdd(product: SaleProductListItem): void;
}

export function SaleProductCard({ product, cartQuantity = 0, onAdd }: SaleProductCardProps) {
	const outOfStock = product.stockQuantity <= 0;
	const disabled = !product.canSell;

	return (
		<button
			type="button"
			className={[
				"relative flex flex-col gap-1.5 rounded-xl border bg-card p-3 text-left transition-colors",
				disabled
					? "opacity-60 cursor-not-allowed"
					: "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			].join(" ")}
			disabled={disabled}
			onClick={() => !disabled && onAdd(product)}
			aria-label={`Agregar ${product.name} al carrito`}
			aria-disabled={disabled}
		>
			{cartQuantity > 0 && (
				<span
					className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1"
					aria-hidden="true"
				>
					{cartQuantity}
				</span>
			)}

			<p className="text-sm font-medium leading-tight line-clamp-2">{product.name}</p>

			{product.barcode && (
				<p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>
			)}

			<div className="flex items-center justify-between gap-2 mt-auto">
				<span className="text-sm font-semibold text-primary">
					{formatMoney(product.salePriceCents)}
				</span>
				<span className={`text-xs ${outOfStock ? "text-destructive" : "text-muted-foreground"}`}>
					<span className="sr-only">Stock: </span>
					{outOfStock ? "Agotado" : `${product.stockQuantity} uds`}
				</span>
			</div>

			{product.categoryName && (
				<Badge variant="outline" className="text-xs self-start">
					{product.categoryName}
				</Badge>
			)}
		</button>
	);
}
