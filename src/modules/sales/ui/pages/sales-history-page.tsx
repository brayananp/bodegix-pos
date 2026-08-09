import { useCallback, useEffect, useId, useState } from "react";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import { formatMoney } from "@/shared/kernel/money";
import { Search01Icon, ShoppingBag03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getRouteApi, useNavigate, useRouter } from "@tanstack/react-router";
import type { SaleHistorySummary, SaleSearchFilters } from "../../application";
import { SaleHistorySheet } from "../components/sale-history-sheet";
import { useSaleHistory, useSalesCount } from "../hooks";
import { resolveSalesDateRange, type SalesHistorySearch } from "../sales-history-search";
import { formatSalesDate, PAYMENT_METHOD_LABELS } from "../sales-format";

const routeApi = getRouteApi("/sales");

export function SalesHistoryPage() {
	const search = routeApi.useSearch();
	const navigate = useNavigate({ from: "/sales" });
	const router = useRouter();
	const [queryDraft, setQueryDraft] = useState(search.q);
	const dateRange = resolveSalesDateRange(search);
	const allSalesCount = useSalesCount();
	const filters: SaleSearchFilters = {
		sort: search.sort,
		...(search.q && { searchText: search.q }),
		...(search.status !== "all" && { status: search.status }),
		...(search.paymentMethod !== "all" && { paymentMethod: search.paymentMethod }),
		...(search.cashSessionId?.trim() && { cashSessionId: search.cashSessionId.trim() }),
		...(dateRange.error
			? { fromDate: Number.MAX_SAFE_INTEGER, toDate: Number.MIN_SAFE_INTEGER }
			: {
					...(dateRange.fromDate !== undefined && { fromDate: dateRange.fromDate }),
					...(dateRange.toDate !== undefined && { toDate: dateRange.toDate }),
				}),
	};
	const result = useSaleHistory(filters, { page: search.page, pageSize: search.pageSize });
	const updateSearch = useCallback(
		(patch: Partial<SalesHistorySearch>, replace = false) =>
			navigate({ search: (previous) => ({ ...previous, ...patch }), replace, resetScroll: false }),
		[navigate],
	);

	useEffect(() => setQueryDraft(search.q), [search.q]);
	useEffect(() => {
		if (result && result.page !== search.page) updateSearch({ page: result.page }, true);
	}, [result, search.page, updateSearch]);

	const changeFilter = (patch: Partial<SalesHistorySearch>) => updateSearch({ ...patch, page: 1 });
	const closePanel = () => updateSearch({ panel: null, saleId: null }, true);

	return (
		<AppShell pageTitle="Historial">
			<PageHeader
				title="Historial de ventas"
				description="Consulta las ventas registradas y sus anulaciones."
				badge={<Badge variant="secondary">{result?.totalCount ?? 0} encontradas</Badge>}
			/>
			<main className="space-y-4 px-4 pb-8 md:px-6">
				<SalesFilters
					search={search}
					queryDraft={queryDraft}
					onQueryDraft={setQueryDraft}
					onSearch={() => changeFilter({ q: queryDraft.trim() })}
					onFilter={changeFilter}
					onClear={() => {
						setQueryDraft("");
						updateSearch({
							q: "",
							status: "all",
							paymentMethod: "all",
							range: "today",
							from: null,
							to: null,
							cashSessionId: null,
							page: 1,
							pageSize: 25,
							sort: "newest",
						});
					}}
				/>
				{dateRange.error && (
					<Alert variant="destructive">
						<AlertTitle>Rango inválido</AlertTitle>
						<AlertDescription>{dateRange.error}</AlertDescription>
					</Alert>
				)}
				{result === undefined ? (
					<SalesListSkeleton />
				) : result.items.length === 0 ? (
					<EmptyState hasAnySale={(allSalesCount ?? 0) > 0} />
				) : (
					<SalesList
						sales={result.items}
						onView={(saleId) => updateSearch({ panel: "detail", saleId })}
					/>
				)}
				{result && result.totalCount > 0 && (
					<Pagination result={result} onPage={(page) => updateSearch({ page })} />
				)}
			</main>
			{search.panel && search.saleId && (
				<SaleHistorySheet
					saleId={search.saleId}
					mode={search.panel}
					onClose={closePanel}
					onBack={() => router.history.back()}
					onStartVoid={() => updateSearch({ panel: "void" })}
					onVoided={() => updateSearch({ panel: "void-result" }, true)}
				/>
			)}
		</AppShell>
	);
}

function SalesFilters({
	search,
	queryDraft,
	onQueryDraft,
	onSearch,
	onFilter,
	onClear,
}: {
	search: SalesHistorySearch;
	queryDraft: string;
	onQueryDraft(value: string): void;
	onSearch(): void;
	onFilter(patch: Partial<SalesHistorySearch>): void;
	onClear(): void;
}) {
	return (
		<section className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-xs">
			<div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 opacity-20 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:18px_18px]" />
			<div className="relative grid gap-3 lg:grid-cols-[minmax(240px,1.5fr)_repeat(3,minmax(150px,.7fr))]">
				<form
					className="flex gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						onSearch();
					}}
				>
					<label className="sr-only" htmlFor="sales-search">
						Buscar venta
					</label>
					<Input
						id="sales-search"
						value={queryDraft}
						onChange={(event) => onQueryDraft(event.target.value)}
						placeholder="Buscar V-000123 o 123"
					/>
					<Button type="submit" variant="secondary" aria-label="Buscar venta">
						<HugeiconsIcon icon={Search01Icon} />
					</Button>
				</form>
				<FilterSelect
					label="Rango de fecha"
					value={search.range}
					onChange={(range) => onFilter({ range: range as SalesHistorySearch["range"] })}
					items={[
						["today", "Hoy"],
						["last_7_days", "Últimos 7 días"],
						["this_month", "Este mes"],
						["all", "Todo"],
						["custom", "Personalizado"],
					]}
				/>
				<FilterSelect
					label="Estado"
					value={search.status}
					onChange={(status) => onFilter({ status: status as SalesHistorySearch["status"] })}
					items={[
						["all", "Todos los estados"],
						["completed", "Completadas"],
						["voided", "Anuladas"],
					]}
				/>
				<FilterSelect
					label="Método de pago"
					value={search.paymentMethod}
					onChange={(paymentMethod) =>
						onFilter({ paymentMethod: paymentMethod as SalesHistorySearch["paymentMethod"] })
					}
					items={[
						["all", "Todos los métodos"],
						["cash", "Efectivo"],
						["yape", "Yape"],
						["plin", "Plin"],
						["card", "Tarjeta"],
						["bank_transfer", "Transferencia"],
					]}
				/>
			</div>
			<div className="relative mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
				{search.range === "custom" && (
					<>
						<LabeledInput
							label="Desde"
							type="date"
							value={search.from ?? ""}
							onChange={(from) => onFilter({ from: from || null })}
						/>
						<LabeledInput
							label="Hasta"
							type="date"
							value={search.to ?? ""}
							onChange={(to) => onFilter({ to: to || null })}
						/>
					</>
				)}
				<LabeledInput
					label="Sesión de caja"
					value={search.cashSessionId ?? ""}
					placeholder="ID de sesión"
					onChange={(cashSessionId) => onFilter({ cashSessionId: cashSessionId || null })}
				/>
				<FilterSelect
					label="Orden"
					value={search.sort}
					onChange={(sort) => onFilter({ sort: sort as SalesHistorySearch["sort"] })}
					items={[
						["newest", "Más recientes"],
						["oldest", "Más antiguas"],
						["total-desc", "Total mayor"],
						["total-asc", "Total menor"],
					]}
				/>
				<FilterSelect
					label="Tamaño de página"
					value={String(search.pageSize)}
					onChange={(pageSize) => onFilter({ pageSize: Number(pageSize) as 25 | 50 | 100 })}
					items={[
						["25", "25 por página"],
						["50", "50 por página"],
						["100", "100 por página"],
					]}
				/>
			</div>
			<div className="relative mt-3 flex justify-end">
				<Button variant="ghost" size="sm" onClick={onClear}>
					Limpiar filtros
				</Button>
			</div>
		</section>
	);
}

function SalesList({
	sales,
	onView,
}: {
	sales: SaleHistorySummary[];
	onView(saleId: string): void;
}) {
	return (
		<section className="overflow-hidden rounded-xl border bg-card">
			<div className="space-y-2 p-2 md:hidden">
				{sales.map((sale) => (
					<SaleCard key={sale.id} sale={sale} onView={onView} />
				))}
			</div>
			<div className="hidden md:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Venta</TableHead>
							<TableHead>Fecha</TableHead>
							<TableHead>Productos</TableHead>
							<TableHead>Pagos</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead className="text-right">Total</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{sales.map((sale) => (
							<TableRow key={sale.id}>
								<TableCell className="font-semibold">{sale.formattedSaleNumber}</TableCell>
								<TableCell>{formatSalesDate(sale.createdAt)}</TableCell>
								<TableCell>
									{sale.itemCount} uds. · {sale.lineCount} líneas
								</TableCell>
								<TableCell>
									{sale.paymentMethods.map((method) => PAYMENT_METHOD_LABELS[method]).join(", ")}
								</TableCell>
								<TableCell>
									<StatusBadge status={sale.status} />
								</TableCell>
								<TableCell className="text-right font-semibold tabular-nums">
									{formatMoney(sale.totalCents)}
								</TableCell>
								<TableCell>
									<Button variant="outline" size="sm" onClick={() => onView(sale.id)}>
										Ver detalle
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</section>
	);
}

function SaleCard({ sale, onView }: { sale: SaleHistorySummary; onView(saleId: string): void }) {
	return (
		<button
			type="button"
			className="min-h-24 w-full rounded-xl border bg-background p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
			onClick={() => onView(sale.id)}
		>
			<div className="flex justify-between gap-3">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<strong>{sale.formattedSaleNumber}</strong>
						<StatusBadge status={sale.status} />
					</div>
					<p className="mt-1 text-xs text-muted-foreground">{formatSalesDate(sale.createdAt)}</p>
					<p className="mt-2 text-xs">
						{sale.itemCount} uds. ·{" "}
						{sale.paymentMethods.map((method) => PAYMENT_METHOD_LABELS[method]).join(", ")}
					</p>
				</div>
				<strong className="text-lg tabular-nums">{formatMoney(sale.totalCents)}</strong>
			</div>
		</button>
	);
}
function StatusBadge({ status }: { status: "completed" | "voided" }) {
	return (
		<Badge variant={status === "voided" ? "destructive" : "secondary"}>
			{status === "voided" ? "Anulada" : "Completada"}
		</Badge>
	);
}
function EmptyState({ hasAnySale }: { hasAnySale: boolean }) {
	return (
		<div className="flex min-h-[38vh] items-center justify-center rounded-xl border border-dashed bg-card">
			<div className="max-w-sm space-y-3 px-5 text-center">
				<HugeiconsIcon icon={ShoppingBag03Icon} className="mx-auto size-12 text-muted-foreground" />
				<h2 className="text-lg font-semibold">
					{hasAnySale
						? "No encontramos ventas con esos filtros."
						: "Todavía no hay ventas registradas."}
				</h2>
				{!hasAnySale && (
					<p className="text-sm text-muted-foreground">Las ventas completadas aparecerán aquí.</p>
				)}
			</div>
		</div>
	);
}
function SalesListSkeleton() {
	const rows = ["first", "second", "third", "fourth", "fifth"];
	return (
		<div className="space-y-2">
			{rows.map((row) => (
				<Skeleton key={row} className="h-24 w-full" />
			))}
		</div>
	);
}
function Pagination({
	result,
	onPage,
}: {
	result: {
		page: number;
		totalPages: number;
		totalCount: number;
		hasPreviousPage: boolean;
		hasNextPage: boolean;
	};
	onPage(page: number): void;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
			<p className="text-sm text-muted-foreground">
				Página {result.page} de {result.totalPages} · {result.totalCount} ventas
			</p>
			<div className="flex gap-2">
				<Button
					variant="outline"
					disabled={!result.hasPreviousPage}
					onClick={() => onPage(result.page - 1)}
				>
					Anterior
				</Button>
				<Button
					variant="outline"
					disabled={!result.hasNextPage}
					onClick={() => onPage(result.page + 1)}
				>
					Siguiente
				</Button>
			</div>
		</div>
	);
}
function FilterSelect({
	label,
	value,
	onChange,
	items,
}: {
	label: string;
	value: string;
	onChange(value: string): void;
	items: Array<[string, string]>;
}) {
	const labelId = useId();
	return (
		<div className="grid gap-1 text-xs font-medium text-muted-foreground">
			<span id={labelId}>{label}</span>
			<Select value={value} onValueChange={(next) => next && onChange(String(next))}>
				<SelectTrigger className="w-full bg-background" aria-labelledby={labelId}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{items.map(([itemValue, itemLabel]) => (
						<SelectItem key={itemValue} value={itemValue}>
							{itemLabel}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
function LabeledInput({
	label,
	onChange,
	...props
}: { label: string; onChange(value: string): void } & Omit<
	React.ComponentProps<typeof Input>,
	"onChange"
>) {
	const generatedId = useId();
	const inputId = props.id ?? generatedId;
	return (
		<label htmlFor={inputId} className="grid gap-1 text-xs font-medium text-muted-foreground">
			<span>{label}</span>
			<Input
				{...props}
				id={inputId}
				onChange={(event) => onChange(event.target.value)}
				className="bg-background"
			/>
		</label>
	);
}
