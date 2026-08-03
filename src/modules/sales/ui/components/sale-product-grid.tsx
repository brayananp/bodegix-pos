import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/shared/components/ui/empty";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { SaleProductListItem } from "../../application";
import { SaleProductCard } from "./sale-product-card";

interface SaleProductGridProps {
	products: SaleProductListItem[] | undefined;
	isLoading: boolean;
	cartQuantities: Record<string, number>;
	onAdd(product: SaleProductListItem): void;
}

export function SaleProductGrid({
	products,
	isLoading,
	cartQuantities,
	onAdd,
}: SaleProductGridProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
		);
	}

	if (!products || products.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>Sin productos</EmptyTitle>
					<EmptyDescription>No se encontraron productos con esos criterios.</EmptyDescription>
				</EmptyHeader>
				<EmptyContent />
			</Empty>
		);
	}

	return (
		<ul
			aria-label="Productos disponibles"
			className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 list-none p-0 m-0"
		>
			{products.map((product) => (
				<li key={product.id}>
					<SaleProductCard
						product={product}
						cartQuantity={cartQuantities[product.id] ?? 0}
						onAdd={onAdd}
					/>
				</li>
			))}
		</ul>
	);
}
