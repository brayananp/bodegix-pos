import { SalesHistoryPage, salesHistorySearchSchema } from "@/modules/sales";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sales")({
	validateSearch: salesHistorySearchSchema,
	component: SalesHistoryPage,
});
