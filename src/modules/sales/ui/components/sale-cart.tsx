import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { SaleDraftReview, SaleProductListItem } from "../../application";
import type { SaleDraft } from "../../domain";
import { calculateSaleDraftTotals } from "../../domain";
import { SaleCartItem } from "./sale-cart-item";
import { SaleCartSummary } from "./sale-cart-summary";
import { SaleCashRequired } from "./sale-cash-required";
import { SaleDraftIssues } from "./sale-draft-issues";

interface SaleCartProps {
	draft: SaleDraft | null | undefined;
	isDraftLoading: boolean;
	review: SaleDraftReview | undefined;
	productMap: Map<string, SaleProductListItem>;
	isCashOpen: boolean;
	isCashLoading: boolean;
	onQuantityChange(productId: string, qty: number): void;
	onRemove(productId: string): void;
	onClear(): void;
	onCheckout(): void;
	onRefreshPrices(): void;
	isRefreshing?: boolean;
}

export function SaleCart({
	draft,
	isDraftLoading,
	review,
	productMap,
	isCashOpen,
	isCashLoading,
	onQuantityChange,
	onRemove,
	onClear,
	onCheckout,
	onRefreshPrices,
	isRefreshing = false,
}: SaleCartProps) {
	const items = draft?.items ?? [];
	const isEmpty = items.length === 0;

	const totals = isEmpty
		? null
		: (() => {
				try {
					return calculateSaleDraftTotals(
						items.map((i) => ({
							productId: i.productId,
							quantity: i.quantity,
							unitPriceCents: i.expectedUnitPriceCents,
						})),
					);
				} catch {
					return null;
				}
			})();

	const productNames = Object.fromEntries([...productMap.entries()].map(([id, p]) => [id, p.name]));

	if (isDraftLoading) {
		return (
			<div className="space-y-3 p-1">
				{Array.from({ length: 3 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
					<Skeleton key={i} className="h-14 rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full gap-3">
			{/* Problemas del carrito */}
			{review && review.issues.length > 0 && (
				<SaleDraftIssues
					issues={review.issues}
					productNames={productNames}
					onRefreshPrices={onRefreshPrices}
					isRefreshing={isRefreshing}
				/>
			)}

			{/* Lista de ítems */}
			{isEmpty ? (
				<div className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-8">
					El carrito está vacío
				</div>
			) : (
				<ScrollArea className="flex-1 -mx-1 px-1">
					<ul aria-label="Ítems del carrito" className="divide-y">
						{items.map((item) => (
							<SaleCartItem
								key={item.productId}
								item={item}
								productName={productMap.get(item.productId)?.name ?? item.productId}
								stock={productMap.get(item.productId)?.stockQuantity ?? item.quantity}
								onQuantityChange={onQuantityChange}
								onRemove={onRemove}
							/>
						))}
					</ul>
				</ScrollArea>
			)}

			{/* Totales */}
			{totals && <SaleCartSummary totals={totals} />}

			{/* Estado de caja */}
			{!isCashLoading && !isCashOpen && <SaleCashRequired />}

			{/* Acciones */}
			<div className="flex gap-2 pt-1">
				{!isEmpty && (
					<AlertDialog>
						<AlertDialogTrigger
							render={
								<Button type="button" variant="outline" size="sm" className="flex-1">
									Limpiar
								</Button>
							}
						/>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>¿Limpiar el carrito?</AlertDialogTitle>
								<AlertDialogDescription>
									Se eliminarán todos los productos del carrito. Esta acción no afecta las ventas
									completadas.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction onClick={onClear}>Limpiar</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
				<Button
					type="button"
					className="flex-1"
					disabled={isEmpty || !isCashOpen || (review?.issues.length ?? 0) > 0}
					onClick={onCheckout}
					aria-disabled={isEmpty || !isCashOpen}
				>
					Cobrar
				</Button>
			</div>
		</div>
	);
}
