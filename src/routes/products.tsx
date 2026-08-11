import { productsSearchSchema } from "@/modules/catalog/ui/catalog-search";
import { CatalogPage } from "@/modules/catalog/ui/pages/catalog-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products")({
	validateSearch: productsSearchSchema,
	component: CatalogPage,
});
