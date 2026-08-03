import { SalePage, saleSearchSchema } from "@/modules/sales";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sale")({
	validateSearch: saleSearchSchema,
	component: SalePage,
});
