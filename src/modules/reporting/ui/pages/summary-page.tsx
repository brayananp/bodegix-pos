import {
	AnalyticsUpIcon,
	ArrowLeft02Icon,
	ArrowRight02Icon,
	Calendar03Icon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { addBusinessDays, getBusinessToday } from "@/shared/kernel/dates";
import {
	CashSection,
	CloseChecklist,
	InventorySection,
	KeyMetrics,
	SalesAndPayments,
	TopProductsAndRecentSales,
} from "../components/summary-sections";
import { DayStatus, SummaryError, SummaryLoading } from "../components/summary-states";
import { useDailyOperationalSummary } from "../hooks/use-daily-operational-summary";
import { resolveSummaryDate, type SummarySearch, type SummarySection } from "../summary-search";

const routeApi = getRouteApi("/summary");
const TIMEZONE = "America/Lima";

export function SummaryPage() {
	const search = routeApi.useSearch();
	const navigate = useNavigate({ from: "/summary" });
	const today = getBusinessToday(TIMEZONE);
	const selectedDate = resolveSummaryDate(search.date, TIMEZONE);
	const summary = useDailyOperationalSummary(selectedDate);
	const updateSearch = (patch: Partial<SummarySearch>) =>
		navigate({ search: (previous) => ({ ...previous, ...patch }), resetScroll: false });
	const formattedDate = summary.data
		? new Intl.DateTimeFormat("es-PE", {
				timeZone: summary.data.timezone,
				dateStyle: "full",
			}).format(summary.data.periodStart)
		: selectedDate;
	return (
		<AppShell pageTitle="Resumen operativo">
			<PageHeader
				title="Resumen operativo"
				description="Ventas, caja e inventario consolidados para una fecha comercial."
				badge={
					<Badge variant="secondary">
						<HugeiconsIcon icon={AnalyticsUpIcon} data-icon="inline-start" />
						Fase 7
					</Badge>
				}
				actions={
					<Button
						variant="ghost"
						size="icon"
						aria-label="Actualizar resumen"
						onClick={summary.retry}
					>
						<HugeiconsIcon icon={RefreshIcon} />
					</Button>
				}
			/>
			<main className="space-y-4 px-4 pb-10 md:px-6">
				<section
					className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between"
					aria-label="Seleccionar fecha comercial"
				>
					<div className="flex min-w-0 items-center gap-3">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<HugeiconsIcon icon={Calendar03Icon} />
						</div>
						<div className="min-w-0">
							<p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
								Fecha comercial
							</p>
							<p className="truncate font-heading text-base font-semibold capitalize">
								{formattedDate}
							</p>
						</div>
					</div>
					<div className="grid grid-cols-[auto_1fr_auto] gap-2 sm:flex">
						<Button
							variant="outline"
							size="icon"
							aria-label="Día anterior"
							onClick={() => updateSearch({ date: addBusinessDays(selectedDate, -1) })}
						>
							<HugeiconsIcon icon={ArrowLeft02Icon} />
						</Button>
						<Button
							variant="outline"
							disabled={selectedDate === today}
							onClick={() => updateSearch({ date: null })}
						>
							Hoy
						</Button>
						<Button
							variant="outline"
							size="icon"
							aria-label="Día siguiente"
							disabled={selectedDate >= today}
							onClick={() => updateSearch({ date: addBusinessDays(selectedDate, 1) })}
						>
							<HugeiconsIcon icon={ArrowRight02Icon} />
						</Button>
					</div>
				</section>
				{summary.isLoading ? (
					<SummaryLoading />
				) : summary.error || !summary.data ? (
					<SummaryError onRetry={summary.retry} />
				) : (
					<>
						<DayStatus summary={summary.data} />
						<KeyMetrics summary={summary.data} />
						<Tabs
							value={search.section}
							onValueChange={(value) => updateSearch({ section: value as SummarySection })}
						>
							<TabsList
								variant="line"
								className="grid w-full grid-cols-4"
								aria-label="Secciones del resumen"
							>
								<TabsTrigger value="overview">General</TabsTrigger>
								<TabsTrigger value="sales">Ventas</TabsTrigger>
								<TabsTrigger value="cash">Caja</TabsTrigger>
								<TabsTrigger value="inventory">Inventario</TabsTrigger>
							</TabsList>
							<TabsContent value="overview" className="mt-3 space-y-4">
								<TopProductsAndRecentSales summary={summary.data} />
								<CloseChecklist checklist={summary.data.closeChecklist} />
							</TabsContent>
							<TabsContent value="sales" className="mt-3">
								<SalesAndPayments summary={summary.data} />
							</TabsContent>
							<TabsContent value="cash" className="mt-3">
								<CashSection summary={summary.data} />
							</TabsContent>
							<TabsContent value="inventory" className="mt-3">
								<InventorySection summary={summary.data} />
							</TabsContent>
						</Tabs>
					</>
				)}
			</main>
		</AppShell>
	);
}
