import { SummaryPage, summarySearchSchema } from "@/modules/reporting";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/summary")({
	validateSearch: summarySearchSchema,
	component: SummaryPage,
});
