import { SummaryPage } from "@/modules/reporting/ui/pages/summary-page";
import { summarySearchSchema } from "@/modules/reporting/ui/summary-search";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/summary")({
	validateSearch: summarySearchSchema,
	component: SummaryPage,
});
