import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { InventoryFilters } from "../components/inventory-filters";
import { InventoryList } from "../components/inventory-list";
import { InventoryMovementList } from "../components/inventory-movement-list";
import { InventorySummary } from "../components/inventory-summary";
import {
	useInventory,
	useInventoryCategories,
	useInventoryMovements,
	useInventoryProduct,
	useInventorySummary,
} from "../hooks/use-inventory-queries";
import type { InventorySearch } from "../inventory-search";
import { InventorySheet } from "../overlays/inventory-sheet";

const routeApi = getRouteApi("/inventory");

export function InventoryPage() {
	const search = routeApi.useSearch();
	const navigate = useNavigate({ from: "/inventory" });
	const inventory = useInventory({
		search: search.q,
		categoryId: search.categoryId,
		productStatus: search.productStatus,
		stockStatus: search.stockStatus,
		page: search.page,
		pageSize: search.pageSize,
		sort: search.sort,
	});
	const movements = useInventoryMovements({
		productId: null,
		movementType: search.movementType,
		page: search.page,
		pageSize: search.pageSize,
	});
	const summary = useInventorySummary();
	const categories = useInventoryCategories();
	const selectedProduct = useInventoryProduct(search.productId);
	const updateSearch = useCallback(
		(patch: Partial<InventorySearch>, replace = false) =>
			navigate({ search: (previous) => ({ ...previous, ...patch }), replace, resetScroll: false }),
		[navigate],
	);
	const closePanel = useCallback(
		() => updateSearch({ panel: null, productId: null }, true),
		[updateSearch],
	);

	useEffect(() => {
		const result = search.tab === "stock" ? inventory : movements;
		if (result && result.page !== search.page) updateSearch({ page: result.page }, true);
	}, [inventory, movements, search.page, search.tab, updateSearch]);

	useEffect(() => {
		if (selectedProduct === null && search.panel !== null) {
			toast.error("El producto solicitado ya no existe.");
			closePanel();
		}
	}, [closePanel, search.panel, selectedProduct]);

	return (
		<AppShell pageTitle="Inventario">
			<PageHeader
				title="Inventario"
				description="Controla existencias y registra cada cambio de stock."
				badge={<Badge variant="secondary">Ledger local</Badge>}
			/>
			<main className="grid gap-4 px-4 pb-8 md:px-6">
				<InventorySummary summary={summary} />
				<Tabs
					value={search.tab}
					onValueChange={(value) => {
						if (value === "stock" || value === "movements") {
							updateSearch({ tab: value, page: 1, panel: null, productId: null });
						}
					}}
				>
					<TabsList aria-label="Secciones de inventario">
						<TabsTrigger value="stock">Stock</TabsTrigger>
						<TabsTrigger value="movements">Movimientos</TabsTrigger>
					</TabsList>
					<InventoryFilters search={search} categories={categories ?? []} onChange={updateSearch} />
					<TabsContent value="stock" className="mt-4">
						{inventory ? (
							<InventoryList
								result={inventory}
								onView={(product) => updateSearch({ panel: "detail", productId: product.id })}
								onPageChange={(page) => updateSearch({ page })}
							/>
						) : (
							<p className="p-6 text-sm text-muted-foreground">Cargando existencias…</p>
						)}
					</TabsContent>
					<TabsContent value="movements" className="mt-4">
						{movements ? (
							<InventoryMovementList
								result={movements}
								onPageChange={(page) => updateSearch({ page })}
							/>
						) : (
							<p className="p-6 text-sm text-muted-foreground">Cargando movimientos…</p>
						)}
					</TabsContent>
				</Tabs>
			</main>
			{search.panel && (
				<InventorySheet
					mode={search.panel}
					product={selectedProduct}
					onClose={closePanel}
					onMode={(panel) => updateSearch({ panel }, true)}
				/>
			)}
		</AppShell>
	);
}
