import { SalePage } from "@/modules/sales/ui/pages/sale-page";
import { saleSearchSchema } from "@/modules/sales/ui/sale-search";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sale")({
	validateSearch: saleSearchSchema,
	component: SalePage,
});
