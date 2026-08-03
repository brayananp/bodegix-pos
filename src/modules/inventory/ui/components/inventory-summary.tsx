import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { InventorySummary as InventorySummaryValue } from "../../application";

const metrics = [
	{ key: "productsInStock", label: "Con stock", detail: "Saldo por encima del mínimo" },
	{ key: "lowStockProducts", label: "Stock bajo", detail: "Requieren atención" },
	{ key: "outOfStockProducts", label: "Agotados", detail: "Saldo actual en cero" },
	{ key: "productsWithoutMovements", label: "Sin inicializar", detail: "Aún sin historial" },
] as const;

export function InventorySummary({ summary }: { summary: InventorySummaryValue | undefined }) {
	return (
		<section
			aria-label="Resumen de inventario"
			className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
		>
			{metrics.map((metric) => (
				<Card key={metric.key} size="sm">
					<CardHeader>
						<CardDescription>{metric.label}</CardDescription>
						<CardTitle className="font-heading text-3xl tabular-nums">
							{summary ? summary[metric.key] : <Skeleton className="h-9 w-14" />}
						</CardTitle>
					</CardHeader>
					<CardContent className="text-xs text-muted-foreground">{metric.detail}</CardContent>
				</Card>
			))}
		</section>
	);
}
