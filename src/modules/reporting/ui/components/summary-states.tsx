import { Alert02Icon, AnalyticsUpIcon, CheckmarkCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { DailyOperationalSummary } from "../../model";

export function SummaryLoading() {
	const metrics = ["sales", "total", "average", "units", "voids"];
	return (
		<output className="grid gap-4" aria-label="Cargando resumen operativo">
			<Skeleton className="h-28 rounded-2xl" />
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
				{metrics.map((metric) => (
					<Skeleton key={metric} className="h-28 rounded-xl" />
				))}
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<Skeleton className="h-72 rounded-xl" />
				<Skeleton className="h-72 rounded-xl" />
			</div>
		</output>
	);
}

export function DayStatus({ summary }: { summary: DailyOperationalSummary }) {
	const hasIssues = summary.closeChecklist.status !== "pass";
	const copy = hasIssues
		? {
				title: "Revisión pendiente",
				description: "Existen operaciones o inconsistencias que requieren atención.",
				label: "Revisar",
				icon: Alert02Icon,
			}
		: summary.status === "no_activity"
			? {
					title: "Sin actividad registrada",
					description: "Todavía no existen operaciones para esta fecha.",
					label: "Sin actividad",
					icon: AnalyticsUpIcon,
				}
			: summary.status === "in_progress"
				? {
						title: "Jornada en progreso",
						description: "Existe una caja abierta. Los indicadores continuarán actualizándose.",
						label: "En progreso",
						icon: AnalyticsUpIcon,
					}
				: {
						title: "Operación finalizada",
						description: "No existen sesiones abiertas. Revisa los indicadores y comprobaciones.",
						label: "Lista para revisar",
						icon: CheckmarkCircleIcon,
					};
	return (
		<Card className="relative overflow-hidden bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary)_10%,var(--card)),var(--card)_65%)]">
			<div
				className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-20 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:20px_20px]"
				aria-hidden="true"
			/>
			<CardHeader className="relative flex-row items-start gap-4">
				<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<HugeiconsIcon icon={copy.icon} className="size-5" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="font-heading text-xl font-semibold">{copy.title}</h2>
						<Badge variant={hasIssues ? "destructive" : "secondary"}>{copy.label}</Badge>
					</div>
					<p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
				</div>
			</CardHeader>
			<CardContent className="relative text-xs text-muted-foreground">
				Jornada de 00:00 a 00:00 (fin exclusivo) · {summary.timezone}
			</CardContent>
		</Card>
	);
}

export function SummaryError({ onRetry }: { onRetry: () => void }) {
	return (
		<Alert variant="destructive">
			<HugeiconsIcon icon={Alert02Icon} />
			<AlertTitle>No se pudo calcular el resumen operativo</AlertTitle>
			<AlertDescription>
				Los datos locales no fueron modificados. Reintenta la lectura; si continúa, ejecuta el
				diagnóstico profundo desde Configuración.
				<button type="button" className="ml-1 font-medium underline" onClick={onRetry}>
					Reintentar
				</button>
			</AlertDescription>
		</Alert>
	);
}
