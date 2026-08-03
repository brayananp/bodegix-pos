import { InventoryPage, inventorySearchSchema } from "@/modules/inventory";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/inventory")({
	validateSearch: inventorySearchSchema,
	component: InventoryPage,
});
