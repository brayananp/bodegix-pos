import { inventorySearchSchema } from "@/modules/inventory/ui/inventory-search";
import { InventoryPage } from "@/modules/inventory/ui/pages/inventory-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/inventory")({
	validateSearch: inventorySearchSchema,
	component: InventoryPage,
});
