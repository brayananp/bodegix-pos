import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import type { InventoryMovementSearchResult } from "../../application";
import type { InventoryMovementType } from "../../domain";

const movementLabels: Record<InventoryMovementType, string> = {
	initial_stock: "Stock inicial",
	purchase: "Entrada de mercadería",
	sale: "Venta",
	sale_void: "Anulación de venta",
	adjustment_in: "Ajuste positivo",
	adjustment_out: "Ajuste negativo",
	damaged: "Dañado",
	expired: "Vencido",
};

function dateLabel(timestamp: number): string {
	return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(
		timestamp,
	);
}

export function InventoryMovementList({
	result,
	onPageChange,
}: {
	result: InventoryMovementSearchResult;
	onPageChange(page: number): void;
}) {
	if (result.items.length === 0)
		return (
			<Empty className="min-h-56 rounded-xl border border-dashed">
				<EmptyHeader>
					<EmptyTitle>Sin movimientos registrados</EmptyTitle>
					<EmptyDescription>
						Los cambios confirmados aparecerán aquí de forma inmutable.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	return (
		<div className="grid gap-4">
			<div className="hidden overflow-hidden rounded-xl border bg-card md:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Fecha</TableHead>
							<TableHead>Producto</TableHead>
							<TableHead>Tipo</TableHead>
							<TableHead className="text-right">Delta</TableHead>
							<TableHead>Transición</TableHead>
							<TableHead>Motivo / referencia</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{result.items.map((movement) => (
							<TableRow key={movement.id}>
								<TableCell className="text-muted-foreground">
									{dateLabel(movement.createdAt)}
								</TableCell>
								<TableCell className="font-medium">{movement.productName}</TableCell>
								<TableCell>
									<Badge variant="outline">{movementLabels[movement.type]}</Badge>
								</TableCell>
								<TableCell className="text-right font-heading text-lg font-semibold tabular-nums">
									{movement.quantityDelta > 0 ? "+" : ""}
									{movement.quantityDelta}
								</TableCell>
								<TableCell className="tabular-nums">
									{movement.stockBefore} → {movement.stockAfter}
								</TableCell>
								<TableCell>{movement.reason ?? movement.referenceId ?? "—"}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<div className="grid gap-3 md:hidden">
				{result.items.map((movement) => (
					<article key={movement.id} className="rounded-xl border bg-card p-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="font-heading font-semibold">{movement.productName}</h3>
								<p className="text-xs text-muted-foreground">{dateLabel(movement.createdAt)}</p>
							</div>
							<Badge variant="outline">{movementLabels[movement.type]}</Badge>
						</div>
						<div className="mt-3 flex items-end justify-between rounded-lg bg-muted/40 p-3">
							<span>
								<small className="block text-muted-foreground">Cambio</small>
								<strong className="font-heading text-2xl tabular-nums">
									{movement.quantityDelta > 0 ? "+" : ""}
									{movement.quantityDelta}
								</strong>
							</span>
							<span className="text-right">
								<small className="block text-muted-foreground">Stock</small>
								<strong className="tabular-nums">
									{movement.stockBefore} → {movement.stockAfter}
								</strong>
							</span>
						</div>
						{(movement.reason || movement.referenceId) && (
							<p className="mt-3 text-sm text-muted-foreground">
								{movement.reason ?? movement.referenceId}
							</p>
						)}
					</article>
				))}
			</div>
			<div className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
				<p className="text-muted-foreground">
					{result.total} movimiento{result.total === 1 ? "" : "s"} · Página {result.page} de{" "}
					{result.totalPages}
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						disabled={result.page <= 1}
						onClick={() => onPageChange(result.page - 1)}
					>
						Anterior
					</Button>
					<Button
						variant="outline"
						disabled={result.page >= result.totalPages}
						onClick={() => onPageChange(result.page + 1)}
					>
						Siguiente
					</Button>
				</div>
			</div>
		</div>
	);
}

export { movementLabels };
