import { CashPage, cashSearchSchema } from "@/modules/cash";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cash")({
	validateSearch: cashSearchSchema,
	component: CashPage,
});
