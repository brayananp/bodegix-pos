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
	const stockLabel = outOfStock ? "Agotado" : `${product.stockQuantity} uds`;

	return (
		<button
			type="button"
			className={[
				"group relative flex h-full min-h-36 w-full flex-col overflow-hidden rounded-2xl border bg-card p-3.5 text-left shadow-xs transition-[border-color,background-color,box-shadow,transform]",
				disabled
					? "cursor-not-allowed bg-muted/25"
					: "hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent/45 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
			].join(" ")}
			disabled={disabled}
			onClick={() => !disabled && onAdd(product)}
			aria-label={
				disabled
					? `${product.name}, ${stockLabel}, no disponible para la venta`
					: `Agregar ${product.name} al carrito, ${formatMoney(product.salePriceCents)}, stock ${product.stockQuantity}`
			}
			aria-disabled={disabled}
		>
			<div className="flex min-h-5 w-full items-center justify-between gap-2">
				{product.categoryName ? (
					<Badge
						variant="secondary"
						className="max-w-[70%] border-0 bg-muted px-2 text-[11px] text-muted-foreground"
					>
						<span className="truncate">{product.categoryName}</span>
					</Badge>
				) : (
					<span />
				)}
				{cartQuantity > 0 && (
					<Badge className="shrink-0 px-2 text-[11px]" aria-label={`${cartQuantity} en el carrito`}>
						{cartQuantity} en carrito
					</Badge>
				)}
			</div>

			<p
				className={`mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-5 sm:text-base ${disabled ? "text-muted-foreground" : "text-foreground"}`}
			>
				{product.name}
			</p>

			{product.barcode && (
				<p className="mt-1 truncate font-mono text-[11px] tracking-wide text-muted-foreground">
					{product.barcode}
				</p>
			)}

			<div className="mt-auto flex w-full items-end justify-between gap-2 border-t border-border/60 pt-3">
				<span
					className={`text-lg font-bold leading-none ${disabled ? "text-muted-foreground" : "text-primary"}`}
				>
					{formatMoney(product.salePriceCents)}
				</span>
				<span
					className={`inline-flex items-center gap-1.5 text-xs font-medium ${outOfStock ? "text-destructive" : "text-muted-foreground"}`}
				>
					<span
						aria-hidden="true"
						className={`size-1.5 rounded-full ${outOfStock ? "bg-destructive" : "bg-emerald-500"}`}
					/>
					<span className="sr-only">Stock: </span>
					{stockLabel}
				</span>
			</div>
		</button>
	);
}
