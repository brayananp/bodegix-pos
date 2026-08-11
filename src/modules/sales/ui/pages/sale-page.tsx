import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { formatMoney } from "@/shared/kernel/money";
import type { CompletedSaleResult, SaleProductListItem } from "../../application";
import { calculateSaleDraftTotals, formatSaleNumber, isSaleError } from "../../domain";
import {
	getCompleteSaleUnitOfWork,
	getSaleDraftStore,
	getSaleProductQueries,
} from "../../infrastructure";
import { SaleCart } from "../components/sale-cart";
import { SaleCategoryFilter } from "../components/sale-category-filter";
import { SaleCheckout } from "../components/sale-checkout";
import { SaleCompletedResult } from "../components/sale-completed-result";
import { SaleProductGrid } from "../components/sale-product-grid";
import { SaleProductSearch } from "../components/sale-product-search";
import type { checkoutValuesToPaymentIntents } from "../forms/checkout/checkout-form.mappers";
import {
	useOpenCashStatus,
	useSaleDraft,
	useSaleDraftReview,
	useSaleProductsForCart,
} from "../hooks";
import { useSaleCategories, useSaleProducts } from "../hooks/use-sale-products";
import { useSaleResult } from "../hooks/use-sale-result";
import { SaleMobileSheet } from "../overlays/sale-mobile-sheet";
import type { SalePanel, SaleSearch } from "../sale-search";

const routeApi = getRouteApi("/sale");

export function SalePage() {
	const search = routeApi.useSearch();
	const navigate = useNavigate({ from: "/sale" });
	const isMobile = useIsMobile();
	const checkoutPanelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isMobile || search.panel !== "checkout") return;
		checkoutPanelRef.current?.scrollIntoView({ block: "start" });
	}, [isMobile, search.panel]);

	// ── Búsqueda / filtros ───────────────────────────────────────────
	const productsResult = useSaleProducts({
		search: search.q,
		categoryId: search.categoryId,
		page: 1,
		pageSize: 40,
	});
	const categoriesResult = useSaleCategories();

	// ── Borrador y revisión ──────────────────────────────────────────
	const draftResult = useSaleDraft();
	const reviewResult = useSaleDraftReview();
	const draft = draftResult.data ?? null;

	// ── Caja ─────────────────────────────────────────────────────────
	const cashStatus = useOpenCashStatus();

	// ── Resultado de venta ───────────────────────────────────────────
	const saleResultQuery = useSaleResult(search.panel === "result" ? (search.saleId ?? null) : null);

	// ── Mapa de productos del carrito (para nombres/stock) ───────────
	const cartProductIds = useMemo(() => (draft?.items ?? []).map((i) => i.productId), [draft]);
	const cartProductsResult = useSaleProductsForCart(cartProductIds);
	const cartProductMap = useMemo(
		() => new Map((cartProductsResult.data ?? []).map((p) => [p.id, p])),
		[cartProductsResult.data],
	);

	// ── Cantidades del carrito para mostrar badges ───────────────────
	const cartQuantities = useMemo(() => {
		const map: Record<string, number> = {};
		for (const item of draft?.items ?? []) {
			map[item.productId] = item.quantity;
		}
		return map;
	}, [draft]);

	const cartItemCount = draft?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

	// ── Estado local de submit error ─────────────────────────────────
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// ── Totales del carrito ──────────────────────────────────────────
	const cartTotals = useMemo(() => {
		const items = draft?.items ?? [];
		if (items.length === 0) return null;
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
	}, [draft]);

	// ── Navegación de search params ──────────────────────────────────
	const updateSearch = useCallback(
		(patch: Partial<SaleSearch>, replace = false) =>
			navigate({
				search: (prev) => ({ ...prev, ...patch }),
				replace,
				resetScroll: false,
			}),
		[navigate],
	);

	const openPanel = useCallback((panel: SalePanel) => updateSearch({ panel }), [updateSearch]);

	const closePanel = useCallback(
		() => updateSearch({ panel: null, saleId: null }, true),
		[updateSearch],
	);

	// ── Handlers del carrito ─────────────────────────────────────────
	const handleAddProduct = useCallback(
		async (product: SaleProductListItem) => {
			try {
				await getSaleDraftStore().addProduct(
					product.id,
					product.salePriceCents,
					product.stockQuantity,
				);
				// Si la búsqueda era el barcode exacto, limpiarla
				if (search.q === product.barcode) {
					void updateSearch({ q: "" }, true);
				}
			} catch (error) {
				const msg = isSaleError(error) ? error.message : "No se pudo agregar el producto";
				toast.error(msg);
			}
		},
		[search.q, updateSearch],
	);

	const handleQuantityChange = useCallback(
		async (productId: string, qty: number) => {
			try {
				const product = cartProductMap.get(productId);
				const stock = product?.stockQuantity ?? 9999;
				await getSaleDraftStore().setQuantity(productId, qty, stock);
			} catch (error) {
				const msg = isSaleError(error) ? error.message : "No se pudo actualizar la cantidad";
				toast.error(msg);
			}
		},
		[cartProductMap],
	);

	const handleRemove = useCallback(async (productId: string) => {
		await getSaleDraftStore().removeProduct(productId);
	}, []);

	const handleClear = useCallback(async () => {
		await getSaleDraftStore().clear();
	}, []);

	const handleRefreshPrices = useCallback(async () => {
		setIsRefreshing(true);
		try {
			const ids = (draft?.items ?? []).map((i) => i.productId);
			const products = await getSaleProductQueries().getProductsByIds(ids);
			const prices: Record<string, number> = {};
			for (const p of products) prices[p.id] = p.salePriceCents;
			await getSaleDraftStore().refreshPrices(prices);
			toast.success("Precios actualizados");
		} catch {
			toast.error("No se pudieron actualizar los precios");
		} finally {
			setIsRefreshing(false);
		}
	}, [draft]);

	// ── Handler de completar venta ───────────────────────────────────
	const handleSubmitCheckout = useCallback(
		async (
			intents: ReturnType<typeof checkoutValuesToPaymentIntents>,
		): Promise<CompletedSaleResult> => {
			setSubmitError(null);
			const result = await getCompleteSaleUnitOfWork().execute({
				paymentIntents: intents,
			});
			return result;
		},
		[],
	);

	const handleSaleComplete = useCallback(
		(result: CompletedSaleResult) => {
			void updateSearch({ panel: "result", saleId: result.saleId }, true);
			toast.success(`Venta ${formatSaleNumber(result.saleNumber)} registrada`);
		},
		[updateSearch],
	);

	const handleBarcodeDetected = useCallback(
		async (barcode: string) => {
			const trimmed = barcode.trim();
			if (!trimmed) return;
			try {
				const result = await getSaleProductQueries().searchProducts({
					search: trimmed,
					categoryId: null,
					page: 1,
					pageSize: 10,
				});
				const exactMatches = result.items.filter((p) => p.barcode === trimmed);
				if (exactMatches.length === 0) {
					toast.error("Producto no encontrado");
					return;
				}
				if (exactMatches.length > 1) {
					toast.error("Código ambiguo: hay más de un producto con ese código");
					return;
				}
				const product = exactMatches[0];
				if (!product) {
					toast.error("Producto no encontrado");
					return;
				}
				if (!product.canSell) {
					toast.error(`${product.name} está agotado`);
					return;
				}
				await handleAddProduct(product);
				void updateSearch({ q: "" }, true);
			} catch {
				toast.error("No se pudo buscar el producto");
			}
		},
		[handleAddProduct, updateSearch],
	);

	const handleNewSale = useCallback(() => {
		void updateSearch({ panel: null, saleId: null, q: "", categoryId: null }, true);
	}, [updateSearch]);

	// ── Render ───────────────────────────────────────────────────────
	const cartPanel = (
		<SaleCart
			draft={draft}
			isDraftLoading={draftResult.isLoading}
			review={reviewResult.data}
			productMap={cartProductMap}
			isCashOpen={cashStatus.data?.isOpen ?? false}
			isCashLoading={cashStatus.isLoading}
			onQuantityChange={handleQuantityChange}
			onRemove={handleRemove}
			onClear={handleClear}
			onCheckout={() => openPanel("checkout")}
			onRefreshPrices={handleRefreshPrices}
			isRefreshing={isRefreshing}
		/>
	);

	const checkoutPanel = cartTotals ? (
		<SaleCheckout
			totals={cartTotals}
			onComplete={handleSaleComplete}
			onCancel={() => openPanel("cart")}
			onSubmit={handleSubmitCheckout}
			submitError={submitError}
		/>
	) : null;

	const resultPanel = saleResultQuery.data ? (
		<SaleCompletedResult result={saleResultQuery.data} onNewSale={handleNewSale} />
	) : saleResultQuery.isLoading ? (
		<p className="text-sm text-muted-foreground py-4">Cargando resultado…</p>
	) : (
		<p className="text-sm text-muted-foreground py-4">Venta no encontrada.</p>
	);

	// ── Móvil ────────────────────────────────────────────────────────
	const mobileSheetOpen = isMobile && search.panel !== null;
	const mobileMode =
		search.panel === "result" ? "result" : search.panel === "checkout" ? "checkout" : "cart";

	return (
		<AppShell pageTitle="Venta">
			<PageHeader
				title="Punto de Venta"
				description="Busca productos, arma el carrito y cobra"
				badge={
					cashStatus.data?.isOpen ? (
						<Badge variant="secondary">Caja abierta</Badge>
					) : (
						<Badge variant="outline">Caja cerrada</Badge>
					)
				}
			/>

			<div className="px-4 pb-4 md:px-6 space-y-3">
				{/* Buscador */}
				<SaleProductSearch
					value={search.q}
					onChange={(q) => void updateSearch({ q }, true)}
					onBarcodeDetected={handleBarcodeDetected}
				/>

				{/* Filtro de categorías */}
				<SaleCategoryFilter
					categories={categoriesResult.data ?? []}
					selectedId={search.categoryId}
					onSelect={(id) => void updateSearch({ categoryId: id }, true)}
				/>
			</div>

			{/* Layout escritorio: split panel */}
			{!isMobile ? (
				<div className="px-4 md:px-6 pb-8">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
						{/* Grid de productos */}
						<section aria-label="Catálogo de productos">
							{search.panel === "result" && saleResultQuery.data ? (
								<div className="rounded-xl border p-4">{resultPanel}</div>
							) : search.panel === "checkout" && cartTotals ? (
								<div ref={checkoutPanelRef} className="scroll-mt-16 rounded-xl border p-4">
									{checkoutPanel}
								</div>
							) : (
								<SaleProductGrid
									products={productsResult.data?.items}
									isLoading={productsResult.isLoading}
									cartQuantities={cartQuantities}
									onAdd={handleAddProduct}
								/>
							)}
						</section>

						{/* Carrito fijo */}
						<aside
							className="rounded-xl border bg-card p-4 h-fit sticky top-4"
							aria-label="Carrito de venta"
						>
							<h2 className="text-sm font-semibold mb-3">Carrito</h2>
							{cartPanel}
						</aside>
					</div>
				</div>
			) : (
				/* Móvil: catálogo + barra inferior */
				<>
					<div className="px-4 pb-32">
						<SaleProductGrid
							products={productsResult.data?.items}
							isLoading={productsResult.isLoading}
							cartQuantities={cartQuantities}
							onAdd={handleAddProduct}
						/>
					</div>

					{/* Barra inferior del carrito */}
					<footer className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-[45] border-t bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3">
						<div className="text-sm">
							{cartItemCount > 0 ? (
								<>
									<span className="font-medium">
										{cartItemCount} artículo{cartItemCount !== 1 ? "s" : ""}
									</span>
									{cartTotals && (
										<span className="text-muted-foreground">
											{" · "}
											{formatMoney(cartTotals.totalCents)}
										</span>
									)}
								</>
							) : (
								<span className="text-muted-foreground">Carrito vacío</span>
							)}
						</div>
						<Button
							type="button"
							size="sm"
							disabled={cartItemCount === 0}
							onClick={() => openPanel("cart")}
						>
							Ver carrito
						</Button>
					</footer>

					{/* Sheet móvil — un solo overlay, modo cambia internamente */}
					<SaleMobileSheet open={mobileSheetOpen} mode={mobileMode} onClose={closePanel}>
						{search.panel === "result"
							? resultPanel
							: search.panel === "checkout" && cartTotals
								? checkoutPanel
								: cartPanel}
					</SaleMobileSheet>
				</>
			)}
		</AppShell>
	);
}
