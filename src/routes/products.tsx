import { CatalogPage, productsSearchSchema } from "@/modules/catalog";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products")({
	validateSearch: productsSearchSchema,
	component: CatalogPage,
});
