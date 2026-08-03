import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";

interface StockTransitionPreviewProps {
	currentStock: number;
	quantityDelta: number | null;
	stockAfter: number | null;
	label: string;
	warning?: boolean;
}

export function StockTransitionPreview({
	currentStock,
	quantityDelta,
	stockAfter,
	label,
	warning = false,
}: StockTransitionPreviewProps) {
	const delta = quantityDelta === null ? "—" : `${quantityDelta > 0 ? "+" : ""}${quantityDelta}`;
	return (
		<Alert variant={warning ? "destructive" : "default"}>
			<AlertTitle>{label}</AlertTitle>
			<AlertDescription>
				<span className="grid grid-cols-3 gap-3 pt-2 text-center">
					<span>
						<span className="block text-xs text-muted-foreground">Actual</span>
						<strong className="font-heading text-lg">{currentStock}</strong>
					</span>
					<span>
						<span className="block text-xs text-muted-foreground">Diferencia</span>
						<strong className="font-heading text-lg">{delta}</strong>
					</span>
					<span>
						<span className="block text-xs text-muted-foreground">Resultante</span>
						<strong className="font-heading text-lg">{stockAfter ?? "—"}</strong>
					</span>
				</span>
			</AlertDescription>
		</Alert>
	);
}
