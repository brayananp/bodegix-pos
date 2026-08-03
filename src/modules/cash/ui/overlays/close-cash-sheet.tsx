import { Button } from "@/shared/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import type { CashSessionSummary } from "../../domain";
import { CloseCashForm } from "../forms/close-cash-form";

export function CloseCashSheet({
	summary,
	onClose,
	onSuccess,
}: {
	summary: CashSessionSummary | null | undefined;
	onClose(): void;
	onSuccess(): void;
}) {
	return (
		<Sheet
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<SheetContent
				side="right"
				showCloseButton={false}
				className="h-dvh w-full max-w-none gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[680px]"
			>
				<SheetHeader className="shrink-0 border-b pr-4 md:px-6">
					<div className="flex items-start justify-between gap-3">
						<div>
							<SheetTitle>Cerrar caja</SheetTitle>
							<SheetDescription>
								Revisa el resumen definitivo y registra el efectivo físico contado.
							</SheetDescription>
						</div>
						<Button variant="ghost" size="sm" onClick={onClose}>
							Cerrar
						</Button>
					</div>
				</SheetHeader>
				{summary ? (
					<CloseCashForm summary={summary} onCancel={onClose} onSuccess={onSuccess} />
				) : (
					<div className="p-6 text-sm text-muted-foreground">Calculando cierre…</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
