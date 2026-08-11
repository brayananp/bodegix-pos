import { cashSearchSchema } from "@/modules/cash/ui/cash-search";
import { CashPage } from "@/modules/cash/ui/pages/cash-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cash")({
	validateSearch: cashSearchSchema,
	component: CashPage,
});
