import { SalesHistoryPage } from "@/modules/sales/ui/pages/sales-history-page";
import { salesHistorySearchSchema } from "@/modules/sales/ui/sales-history-search";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sales")({
	validateSearch: salesHistorySearchSchema,
	component: SalesHistoryPage,
});
