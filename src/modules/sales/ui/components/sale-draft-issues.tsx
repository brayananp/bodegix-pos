import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { formatMoney } from "@/shared/kernel/money";
import type { SaleDraftIssue } from "../../application";

const ISSUE_LABELS: Record<SaleDraftIssue["code"], string> = {
	PRODUCT_NOT_FOUND: "El producto ya no existe",
	PRODUCT_INACTIVE: "El producto está inactivo",
	PRODUCT_OUT_OF_STOCK: "El producto está agotado",
	INSUFFICIENT_STOCK: "Stock insuficiente",
	PRODUCT_PRICE_CHANGED: "El precio cambió",
};

interface SaleDraftIssuesProps {
	issues: SaleDraftIssue[];
	productNames: Record<string, string>;
	onRefreshPrices(): void;
	isRefreshing?: boolean;
}

export function SaleDraftIssues({
	issues,
	productNames,
	onRefreshPrices,
	isRefreshing = false,
}: SaleDraftIssuesProps) {
	if (issues.length === 0) return null;

	const hasPriceChanges = issues.some((i) => i.code === "PRODUCT_PRICE_CHANGED");

	return (
		<Alert variant="destructive" role="alert" aria-live="assertive">
			<AlertTitle>El carrito tiene problemas</AlertTitle>
			<AlertDescription>
				<ul className="list-disc list-inside space-y-1 mt-1">
					{issues.map((issue) => {
						const name = productNames[issue.productId] ?? issue.productId;
						let detail = "";
						if (
							issue.code === "PRODUCT_PRICE_CHANGED" &&
							issue.expectedUnitPriceCents !== undefined &&
							issue.currentUnitPriceCents !== undefined
						) {
							detail = ` — precio cambió de ${formatMoney(issue.expectedUnitPriceCents)} a ${formatMoney(issue.currentUnitPriceCents)}`;
						} else if (
							issue.code === "INSUFFICIENT_STOCK" &&
							issue.requestedQuantity !== undefined &&
							issue.availableQuantity !== undefined
						) {
							detail = ` — solicitado: ${issue.requestedQuantity}, disponible: ${issue.availableQuantity}`;
						} else if (issue.code === "PRODUCT_OUT_OF_STOCK") {
							detail = " — sin existencias";
						}
						return (
							<li key={issue.productId} className="text-sm">
								<span className="font-medium">{name}</span>: {ISSUE_LABELS[issue.code]}
								{detail}
							</li>
						);
					})}
				</ul>
				{hasPriceChanges && (
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={onRefreshPrices}
						disabled={isRefreshing}
						className="mt-2"
					>
						{isRefreshing ? "Actualizando…" : "Actualizar precios"}
					</Button>
				)}
			</AlertDescription>
		</Alert>
	);
}
