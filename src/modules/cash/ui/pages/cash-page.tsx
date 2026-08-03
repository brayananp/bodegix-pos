import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { formatMoney } from "@/shared/kernel/money";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { formatCashDate } from "../cash-format";
import { CashMovementList } from "../components/cash-movement-list";
import { CashSessionList } from "../components/cash-session-list";
import { CashCurrentSummary, CashPaymentBreakdown } from "../components/cash-summary";
import {
	useCashMovements,
	useCashSessions,
	useCashSessionSummary,
	useCashStatus,
} from "../hooks/use-cash-queries";
import type { CashPanel, CashSearch } from "../cash-search";
import { CashOperationDialogDrawer } from "../overlays/cash-operation-dialog-drawer";
import { CashSessionDetailSheet } from "../overlays/cash-session-detail-sheet";
import { CloseCashSheet } from "../overlays/close-cash-sheet";

const routeApi = getRouteApi("/cash");

export function CashPage() {
	const search = routeApi.useSearch();
	const navigate = useNavigate({ from: "/cash" });
	const status = useCashStatus();
	const openSessionId = status.data?.openSession?.id ?? null;
	const currentSummary = useCashSessionSummary(openSessionId);
	const history = useCashSessions({ page: search.page, pageSize: search.pageSize });
	const currentMovements = useCashMovements(
		openSessionId ? { cashSessionId: openSessionId, page: 1, pageSize: 25 } : null,
	);
	const detailId = search.panel === "detail" ? search.sessionId : null;
	const detailSummary = useCashSessionSummary(detailId);
	const detailMovements = useCashMovements(
		detailId ? { cashSessionId: detailId, page: 1, pageSize: search.pageSize } : null,
	);
	const updateSearch = useCallback(
		(patch: Partial<CashSearch>, replace = false) =>
			navigate({ search: (previous) => ({ ...previous, ...patch }), replace, resetScroll: false }),
		[navigate],
	);
	const closePanel = useCallback(
		(expectedPanel: CashPanel) =>
			navigate({
				search: (previous) =>
					previous.panel === expectedPanel
						? { ...previous, panel: null, sessionId: null }
						: previous,
				replace: true,
				resetScroll: false,
			}),
		[navigate],
	);

	useEffect(() => {
		if (history.data && history.data.page !== search.page)
			updateSearch({ page: history.data.page }, true);
	}, [history.data, search.page, updateSearch]);
	useEffect(() => {
		if (search.panel === "open" && status.data?.isOpen) {
			toast.info("La caja ya está abierta.");
			closePanel("open");
		}
		if (
			["deposit", "withdrawal", "close"].includes(search.panel ?? "") &&
			status.data &&
			!status.data.isOpen
		) {
			toast.info("La sesión ya no está abierta.");
			closePanel(search.panel as CashPanel);
		}
	}, [closePanel, search.panel, status.data]);

	const error = status.error ?? currentSummary.error ?? history.error;
	return (
		<AppShell pageTitle="Caja">
			<PageHeader
				title="Caja"
				description="Controla el efectivo de una jornada, incluso sin conexión."
				badge={
					<Badge variant={status.data?.isOpen ? "secondary" : "outline"}>
						{status.data?.isOpen ? "Sesión abierta" : "Caja cerrada"}
					</Badge>
				}
			/>
			<main className="grid gap-4 px-4 pb-8 md:px-6">
				{error && (
					<Alert variant="destructive">
						<AlertTitle>No se pudo leer la caja local</AlertTitle>
						<AlertDescription>
							Recarga la página. Tus datos permanecen en este dispositivo.
						</AlertDescription>
					</Alert>
				)}
				<Tabs
					value={search.tab}
					onValueChange={(value) => {
						if (value === "current" || value === "history")
							updateSearch({ tab: value, page: 1, panel: null, sessionId: null });
					}}
				>
					<TabsList aria-label="Secciones de caja">
						<TabsTrigger value="current">Caja actual</TabsTrigger>
						<TabsTrigger value="history">Historial</TabsTrigger>
					</TabsList>
					<TabsContent value="current" className="mt-4 space-y-4">
						{status.isLoading ? (
							<div className="rounded-xl border p-8 text-sm text-muted-foreground">
								Consultando la caja local…
							</div>
						) : status.data?.isOpen && currentSummary.data ? (
							<>
								<section className="relative overflow-hidden rounded-2xl border bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary)_12%,var(--card)),var(--card)_58%)] p-5 md:p-6">
									<div
										className="absolute inset-y-0 right-0 w-1/3 opacity-20 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:20px_20px]"
										aria-hidden="true"
									/>
									<div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
												Jornada en curso
											</p>
											<h2 className="mt-2 font-heading text-2xl font-semibold">Caja operativa</h2>
											<p className="mt-1 text-sm text-muted-foreground">
												Abierta {formatCashDate(currentSummary.data.openedAt)} · Fondo inicial{" "}
												{formatMoney(currentSummary.data.openingCashCents)}
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											<Button
												variant="outline"
												onClick={() => updateSearch({ panel: "deposit", sessionId: openSessionId })}
											>
												Registrar depósito
											</Button>
											<Button
												variant="outline"
												onClick={() =>
													updateSearch({ panel: "withdrawal", sessionId: openSessionId })
												}
											>
												Registrar retiro
											</Button>
											<Button
												onClick={() => updateSearch({ panel: "close", sessionId: openSessionId })}
											>
												Cerrar caja
											</Button>
										</div>
									</div>
								</section>
								<CashCurrentSummary summary={currentSummary.data} />
								<div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.7fr)]">
									<CashMovementList result={currentMovements.data} />
									<CashPaymentBreakdown summary={currentSummary.data} />
								</div>
							</>
						) : (
							<section className="relative overflow-hidden rounded-2xl border bg-card px-5 py-10 text-center shadow-xs md:py-14">
								<div className="mx-auto flex size-16 items-center justify-center rounded-2xl border bg-muted/40 font-heading text-2xl font-semibold text-muted-foreground">
									C
								</div>
								<p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Sin jornada activa
								</p>
								<h2 className="mt-2 font-heading text-2xl font-semibold">Caja cerrada</h2>
								<p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
									Abre una sesión para registrar el fondo inicial, depósitos, retiros y el arqueo
									final.
								</p>
								<Button
									className="mt-6 min-w-36"
									onClick={() => updateSearch({ panel: "open", sessionId: null })}
								>
									Abrir caja
								</Button>
								{status.data?.lastClosedSession && (
									<p className="mt-5 text-xs text-muted-foreground">
										Último cierre:{" "}
										{formatCashDate(
											status.data.lastClosedSession.closedAt ??
												status.data.lastClosedSession.openedAt,
										)}
									</p>
								)}
							</section>
						)}
					</TabsContent>
					<TabsContent value="history" className="mt-4">
						<CashSessionList
							result={history.data}
							onView={(sessionId) => updateSearch({ panel: "detail", sessionId })}
							onPageChange={(page) => updateSearch({ page })}
						/>
					</TabsContent>
				</Tabs>
			</main>
			{search.panel && ["open", "deposit", "withdrawal"].includes(search.panel) && (
				<CashOperationDialogDrawer
					panel={search.panel as "open" | "deposit" | "withdrawal"}
					summary={currentSummary.data}
					onClose={() => closePanel(search.panel as CashPanel)}
					onSuccess={() => closePanel(search.panel as CashPanel)}
				/>
			)}
			{search.panel === "close" && (
				<CloseCashSheet
					summary={currentSummary.data}
					onClose={() => closePanel("close")}
					onSuccess={() => {
						updateSearch({ panel: null, sessionId: null, tab: "history", page: 1 }, true);
					}}
				/>
			)}
			{search.panel === "detail" && (
				<CashSessionDetailSheet
					summary={detailSummary.data}
					movements={detailMovements.data}
					onClose={() => closePanel("detail")}
				/>
			)}
		</AppShell>
	);
}
