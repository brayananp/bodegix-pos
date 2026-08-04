import { SalesHistoryPage } from "@/modules/sales/ui/pages/sales-history-page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Schema de validación para los search params de la ruta /sales.
 */
const salesSearchSchema = z.object({
	page: z.number().int().positive().catch(1),
	search: z.string().optional(),
	status: z.enum(["completed", "voided"]).optional(),
	method: z.enum(["cash", "yape", "plin", "card", "bank_transfer"]).optional(),
	session: z.string().optional(),
});

export const Route = createFileRoute("/sales")({
	component: SalesHistoryPage,
	validateSearch: salesSearchSchema,
});
