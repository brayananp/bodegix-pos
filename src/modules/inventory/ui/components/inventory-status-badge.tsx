import { Badge } from "@/shared/components/ui/badge";
import type { InventoryStockStatus } from "../../domain";

const labels: Record<InventoryStockStatus, string> = {
	in_stock: "Con stock",
	low_stock: "Stock bajo",
	out_of_stock: "Agotado",
};

export function InventoryStatusBadge({ status }: { status: InventoryStockStatus }) {
	return (
		<Badge
			variant={
				status === "out_of_stock" ? "destructive" : status === "low_stock" ? "outline" : "secondary"
			}
		>
			{labels[status]}
		</Badge>
	);
}
