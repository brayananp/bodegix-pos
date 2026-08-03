import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { formatMoney } from "@/shared/kernel/money";
import { getCashDifferenceStatus } from "../../domain";
import { formatSignedMoney } from "../cash-format";

export function CashDifferenceDisplay({
	differenceCents,
	className,
}: {
	differenceCents: number;
	className?: string;
}) {
	const status = getCashDifferenceStatus(differenceCents);
	const copy =
		status === "balanced"
			? {
					label: "Cuadrada",
					detail: "La caja coincide con el efectivo esperado.",
					tone: "text-primary bg-primary/8 border-primary/20",
				}
			: status === "surplus"
				? {
						label: "Sobrante",
						detail: `Existe un sobrante de ${formatSignedMoney(differenceCents)}.`,
						tone: "text-blue-700 bg-blue-500/8 border-blue-500/20 dark:text-blue-300",
					}
				: {
						label: "Faltante",
						detail: `Existe un faltante de ${formatMoney(Math.abs(differenceCents))}.`,
						tone: "text-destructive bg-destructive/8 border-destructive/20",
					};
	return (
		<output className={cn("rounded-xl border p-4", copy.tone, className)} aria-live="polite">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-xs font-medium uppercase tracking-[0.16em]">Diferencia</p>
					<p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
						{formatSignedMoney(differenceCents)}
					</p>
				</div>
				<Badge variant="outline" className="border-current/20 bg-background/50">
					{copy.label}
				</Badge>
			</div>
			<p className="mt-2 text-sm opacity-85">{copy.detail}</p>
		</output>
	);
}
