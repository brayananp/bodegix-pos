import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatMoney } from "@/shared/kernel/money";
import { Search01Icon, ShoppingBag03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import type { SaleHistorySummary } from "../../application";
import { useSaleHistory } from "../hooks";

const PAGE_SIZE = 20;

/**
 * Formatea timestamp a fecha corta legible.
 */
function formatShortDate(timestamp: number): string {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "short",
		timeStyle: "short",
	}).format(timestamp);
}

/**
 * Página de historial de ventas.
 *
 * Muestra listado de ventas con filtros, búsqueda y paginación.
 * Permite ver detalle y anular ventas desde un Sheet.
 */
export function SalesHistoryPage() {
	const navigate = useNavigate();
	const searchParams = useSearch({ from: "/sales" });
	const [searchInput, setSearchInput] = useState(searchParams.search ?? "");

	const page = searchParams.page ?? 1;
	const status = searchParams.status;
	const method = searchParams.method;

	const filters: import("../../application").SaleSearchFilters = {
		...(searchParams.search && { searchText: searchParams.search }),
		...(status && { status }),
		...(method && { paymentMethod: method }),
	};

	const result = useSaleHistory(filters, { page, pageSize: PAGE_SIZE });

	const handleSearch = () => {
		navigate({
			to: "/sales",
			search: {
				...searchParams,
				search: searchInput.trim() || undefined,
				page: 1,
			},
		});
	};

	const handleFilterChange = (key: string, value: string | undefined) => {
		navigate({
			to: "/sales",
			search: {
				...searchParams,
				[key]: value || undefined,
				page: 1,
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			to: "/sales",
			search: { ...searchParams, page: newPage },
		});
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
					<HugeiconsIcon icon={ShoppingBag03Icon} className="size-6 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Historial de Ventas</h1>
					<p className="text-sm text-muted-foreground">
						Consulta y gestiona las ventas registradas
					</p>
				</div>
			</div>

			{/* Filtros */}
			<div className="flex flex-wrap gap-3">
				<div className="flex flex-1 gap-2">
					<Input
						placeholder="Buscar por número, producto o referencia..."
						value={searchInput}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
						onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
							if (e.key === "Enter") handleSearch();
						}}
						className="flex-1"
					/>
					<Button onClick={handleSearch} variant="secondary">
						<HugeiconsIcon icon={Search01Icon} className="size-4" />
						Buscar
					</Button>
				</div>

				<Select
					value={status ?? "all"}
					onValueChange={(v: string | null) =>
						handleFilterChange("status", v === "all" || v === null ? undefined : v)
					}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Estado" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="completed">Completadas</SelectItem>
						<SelectItem value="voided">Anuladas</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={method ?? "all"}
					onValueChange={(v: string | null) =>
						handleFilterChange("method", v === "all" || v === null ? undefined : v)
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Método de pago" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos los métodos</SelectItem>
						<SelectItem value="cash">Efectivo</SelectItem>
						<SelectItem value="yape">Yape</SelectItem>
						<SelectItem value="plin">Plin</SelectItem>
						<SelectItem value="card">Tarjeta</SelectItem>
						<SelectItem value="bank_transfer">Transferencia</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Lista de ventas */}
			<div className="flex-1 overflow-auto">
				{!result ? (
					<SalesListSkeleton />
				) : result.items.length === 0 ? (
					<EmptyState />
				) : (
					<div className="space-y-2">
						{result.items.map((sale) => (
							<SaleCard key={sale.id} sale={sale} />
						))}
					</div>
				)}
			</div>

			{/* Paginación */}
			{result && result.totalPages > 1 && (
				<div className="flex items-center justify-between border-t pt-4">
					<p className="text-sm text-muted-foreground">
						Página {result.page} de {result.totalPages} · {result.totalCount} ventas
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={!result.hasPreviousPage}
							onClick={() => handlePageChange(page - 1)}
						>
							Anterior
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!result.hasNextPage}
							onClick={() => handlePageChange(page + 1)}
						>
							Siguiente
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

interface SaleCardProps {
	sale: SaleHistorySummary;
}

function SaleCard({ sale }: SaleCardProps) {
	const statusLabel = sale.status === "completed" ? "Completada" : "Anulada";
	const statusColor = sale.status === "completed" ? "text-green-600" : "text-red-600";

	const methodsLabel = sale.paymentMethods
		.map((m) => {
			switch (m) {
				case "cash":
					return "Efectivo";
				case "yape":
					return "Yape";
				case "plin":
					return "Plin";
				case "card":
					return "Tarjeta";
				case "bank_transfer":
					return "Transferencia";
				default:
					return m;
			}
		})
		.join(", ");

	return (
		<div className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer">
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold">Venta #{sale.saleNumber}</h3>
						<span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
					</div>
					<p className="text-sm text-muted-foreground">
						{formatShortDate(sale.createdAt)} · {sale.itemCount} items
					</p>
					<p className="text-xs text-muted-foreground">{methodsLabel}</p>
				</div>
				<div className="text-right">
					<p className="text-lg font-semibold">{formatMoney(sale.totalCents)}</p>
				</div>
			</div>
		</div>
	);
}

function SalesListSkeleton() {
	return (
		<div className="space-y-2">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-24 w-full" />
			))}
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center space-y-2">
				<HugeiconsIcon icon={ShoppingBag03Icon} className="mx-auto size-12 text-muted-foreground" />
				<h3 className="text-lg font-semibold">No hay ventas</h3>
				<p className="text-sm text-muted-foreground">
					No se encontraron ventas con los filtros seleccionados
				</p>
			</div>
		</div>
	);
}
