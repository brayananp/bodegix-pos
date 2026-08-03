import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { setCategoryActiveState, setProductActiveState } from "../../application";
import type { Category, Product } from "../../domain";
import { getCatalogStore } from "../../infrastructure";
import type { ProductsSearch } from "../catalog-search";
import { CategoryList } from "../components/category-list";
import { ProductFilters } from "../components/product-filters";
import { ProductList } from "../components/product-list";
import { useCategories, useCategory, useProduct, useProducts } from "../hooks/use-catalog-queries";
import {
	CatalogActiveStateDialog,
	type ActiveStateTarget,
} from "../overlays/catalog-active-state-dialog";
import { CategoryDialogDrawer } from "../overlays/category-dialog-drawer";
import { ProductSheet } from "../overlays/product-sheet";

const routeApi = getRouteApi("/products");

export function CatalogPage() {
	const search = routeApi.useSearch();
	const navigate = useNavigate({ from: "/products" });
	const [activeStateTarget, setActiveStateTarget] = useState<ActiveStateTarget | null>(null);
	const [isChangingState, setIsChangingState] = useState(false);
	const products = useProducts({
		search: search.q,
		categoryId: search.categoryId,
		status: search.status,
		page: search.page,
		pageSize: search.pageSize,
		sort: search.sort,
	});
	const allCategories = useCategories({ status: "all" });
	const visibleCategories = useCategories({ search: search.q, status: search.status });
	const selectedProduct = useProduct(search.productId);
	const selectedCategory = useCategory(search.categoryEditId);

	const updateSearch = useCallback(
		(patch: Partial<ProductsSearch>, replace = false) =>
			navigate({ search: (previous) => ({ ...previous, ...patch }), replace, resetScroll: false }),
		[navigate],
	);
	const closePanel = useCallback(
		() => updateSearch({ panel: null, productId: null, categoryEditId: null }, true),
		[updateSearch],
	);

	useEffect(() => {
		if (products && products.page !== search.page) updateSearch({ page: products.page }, true);
	}, [products, search.page, updateSearch]);

	useEffect(() => {
		if (
			selectedProduct === null &&
			(search.panel === "product-detail" || search.panel === "product-edit")
		) {
			toast.error("El producto solicitado ya no existe.");
			closePanel();
		}
	}, [search.panel, selectedProduct, closePanel]);

	useEffect(() => {
		if (selectedCategory === null && search.panel === "category-edit") {
			toast.error("La categoría solicitada ya no existe.");
			closePanel();
		}
	}, [search.panel, selectedCategory, closePanel]);

	const openProduct = (product: Product, mode: "detail" | "edit") =>
		updateSearch({ panel: `product-${mode}`, productId: product.id, categoryEditId: null });
	const requestProductState = (product: Product) =>
		setActiveStateTarget({
			kind: "product",
			id: product.id,
			name: product.name,
			isActive: product.isActive,
		});
	const requestCategoryState = (category: Category) =>
		setActiveStateTarget({
			kind: "category",
			id: category.id,
			name: category.name,
			isActive: category.isActive,
		});

	async function confirmActiveState(): Promise<void> {
		if (!activeStateTarget || isChangingState) return;
		setIsChangingState(true);
		try {
			const nextState = !activeStateTarget.isActive;
			if (activeStateTarget.kind === "product") {
				await setProductActiveState(getCatalogStore(), activeStateTarget.id, nextState);
			} else {
				await setCategoryActiveState(getCatalogStore(), activeStateTarget.id, nextState);
			}
			toast.success(nextState ? "Registro reactivado" : "Registro desactivado");
			setActiveStateTarget(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado.");
		} finally {
			setIsChangingState(false);
		}
	}

	const productPanelMode =
		search.panel === "product-create"
			? "create"
			: search.panel === "product-detail"
				? "detail"
				: search.panel === "product-edit"
					? "edit"
					: null;
	const categoryPanelMode =
		search.panel === "category-create"
			? "create"
			: search.panel === "category-edit"
				? "edit"
				: null;

	return (
		<AppShell pageTitle="Productos">
			<PageHeader
				title="Productos"
				description="Productos, precios y categorías disponibles en esta bodega"
				badge={<Badge variant="secondary">Local y sin conexión</Badge>}
				actions={
					<Button
						onClick={() =>
							updateSearch({
								panel: search.tab === "products" ? "product-create" : "category-create",
								productId: null,
								categoryEditId: null,
							})
						}
					>
						{search.tab === "products" ? "Nuevo producto" : "Nueva categoría"}
					</Button>
				}
			/>
			<main className="grid gap-4 px-4 pb-8 md:px-6">
				<Tabs
					value={search.tab}
					onValueChange={(value) => {
						if (value === "products" || value === "categories") {
							updateSearch({
								tab: value,
								page: 1,
								panel: null,
								productId: null,
								categoryEditId: null,
							});
						}
					}}
				>
					<TabsList aria-label="Secciones del catálogo">
						<TabsTrigger value="products">Productos</TabsTrigger>
						<TabsTrigger value="categories">Categorías</TabsTrigger>
					</TabsList>
					<TabsContent value="products" className="grid gap-4">
						<ProductFilters
							search={search}
							categories={allCategories ?? []}
							onChange={(patch) => updateSearch(patch)}
						/>
						{products ? (
							<ProductList
								result={products}
								onView={(product) => openProduct(product, "detail")}
								onEdit={(product) => openProduct(product, "edit")}
								onToggleActive={requestProductState}
								onCreate={() => updateSearch({ panel: "product-create", productId: null })}
								onPageChange={(page) => updateSearch({ page })}
							/>
						) : (
							<p className="p-6 text-sm text-muted-foreground">Cargando productos…</p>
						)}
					</TabsContent>
					<TabsContent value="categories">
						<CategoryList
							categories={visibleCategories ?? []}
							search={search.q}
							onSearch={(q) => updateSearch({ q, page: 1 })}
							onCreate={() => updateSearch({ panel: "category-create", categoryEditId: null })}
							onEdit={(category) =>
								updateSearch({ panel: "category-edit", categoryEditId: category.id })
							}
							onToggleActive={requestCategoryState}
						/>
					</TabsContent>
				</Tabs>
			</main>

			{productPanelMode && (
				<ProductSheet
					mode={productPanelMode}
					product={selectedProduct}
					categories={allCategories ?? []}
					onClose={closePanel}
					onEdit={() => updateSearch({ panel: "product-edit" }, true)}
					onSaved={(product) => {
						if (productPanelMode === "edit") {
							updateSearch({ panel: "product-detail", productId: product.id }, true);
						} else {
							closePanel();
						}
					}}
					onToggleActive={requestProductState}
				/>
			)}
			{categoryPanelMode && (
				<CategoryDialogDrawer
					mode={categoryPanelMode}
					{...(selectedCategory ? { category: selectedCategory } : {})}
					onClose={closePanel}
					onSuccess={() => closePanel()}
				/>
			)}
			<CatalogActiveStateDialog
				target={activeStateTarget}
				onClose={() => setActiveStateTarget(null)}
				onConfirm={() => void confirmActiveState()}
				isSubmitting={isChangingState}
			/>
		</AppShell>
	);
}
