import type { CashSessionSummary } from "../../domain";
import { CashMovementForm } from "../forms/cash-movement-form";
import { OpenCashForm } from "../forms/open-cash-form";
import type { CashPanel } from "../cash-search";
import { ResponsiveCashDialogDrawer } from "./responsive-cash-dialog-drawer";

export function CashOperationDialogDrawer({
	panel,
	summary,
	onClose,
	onSuccess,
}: {
	panel: Extract<CashPanel, "open" | "deposit" | "withdrawal">;
	summary: CashSessionSummary | null | undefined;
	onClose(): void;
	onSuccess(): void;
}) {
	const copy =
		panel === "open"
			? {
					title: "Abrir caja",
					description: "Registra el efectivo físico con el que comienza esta jornada.",
				}
			: panel === "deposit"
				? {
						title: "Registrar depósito",
						description: "Agrega efectivo manual y conserva el motivo en el historial.",
					}
				: {
						title: "Registrar retiro",
						description: "Retira efectivo sin dejar el saldo esperado en negativo.",
					};
	return (
		<ResponsiveCashDialogDrawer
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			{...copy}
		>
			{panel === "open" ? (
				<OpenCashForm onCancel={onClose} onSuccess={onSuccess} />
			) : !summary ? (
				<div className="p-6 text-sm text-muted-foreground">Actualizando efectivo disponible…</div>
			) : (
				<CashMovementForm
					mode={panel === "deposit" ? "deposit" : "withdrawal"}
					cashSessionId={summary.sessionId}
					currentExpectedCashCents={summary.expectedCashCents}
					onCancel={onClose}
					onSuccess={onSuccess}
				/>
			)}
		</ResponsiveCashDialogDrawer>
	);
}
