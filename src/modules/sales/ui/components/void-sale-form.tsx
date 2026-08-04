import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { VOID_REASON_MAX_LENGTH, VOID_REASON_MIN_LENGTH } from "../../domain";
import { useVoidSaleAction } from "../hooks";
import { ResponsiveDialogDrawer } from "./responsive-dialog-drawer";

interface VoidSaleFormProps {
	saleId: string;
	saleNumber: number;
	onSuccess: () => void;
}

/**
 * Formulario para anular una venta.
 *
 * Solicita motivo de anulación (5-240 caracteres) y muestra
 * confirmación explícita antes de ejecutar la anulación.
 *
 * Usa Dialog en desktop y Drawer en móvil para mejor UX.
 */
export function VoidSaleForm({ saleId, saleNumber, onSuccess }: VoidSaleFormProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [reason, setReason] = useState("");
	const { isVoiding, executeVoid } = useVoidSaleAction();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const success = await executeVoid(saleId, reason);
		if (success) {
			setIsOpen(false);
			setReason("");
			onSuccess();
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!isVoiding) {
			setIsOpen(open);
			if (!open) {
				setReason("");
			}
		}
	};

	const isReasonValid = reason.trim().length >= VOID_REASON_MIN_LENGTH;
	const remainingChars = VOID_REASON_MAX_LENGTH - reason.length;

	return (
		<>
			<Button
				variant="destructive"
				className="w-full"
				type="button"
				onClick={() => setIsOpen(true)}
			>
				<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
				Anular venta
			</Button>

			<ResponsiveDialogDrawer
				open={isOpen}
				onOpenChange={handleOpenChange}
				title={`Anular Venta #${saleNumber}`}
				description="Esta acción no se puede deshacer. La venta se marcará como anulada y el stock será devuelto a los productos."
			>
				<form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
					{/* Contenido scrollable */}
					<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
						<div className="space-y-5">
							{/* Advertencias */}
							<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3.5">
								<p className="mb-2 text-sm font-semibold text-destructive">Confirma que:</p>
								<ul className="text-xs text-muted-foreground space-y-1.5 ml-4 list-disc">
									<li>La venta fue registrada por error</li>
									<li>Los productos serán devueltos al inventario</li>
									<li>Los pagos serán marcados como anulados</li>
									<li>Esta acción solo es reversible desde la base de datos</li>
								</ul>
							</div>

							{/* Motivo */}
							<div className="space-y-2">
								<Label htmlFor="reason">
									Motivo de anulación <span className="text-destructive">*</span>
								</Label>
								<Textarea
									id="reason"
									placeholder="Describe por qué se anula esta venta..."
									value={reason}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										setReason(e.target.value.slice(0, VOID_REASON_MAX_LENGTH))
									}
									rows={4}
									className="resize-none"
									required
									disabled={isVoiding}
								/>
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>
										Mínimo {VOID_REASON_MIN_LENGTH} caracteres, {reason.trim().length} actual
									</span>
									<span className={remainingChars < 20 ? "text-destructive" : ""}>
										{remainingChars} restantes
									</span>
								</div>
							</div>

							{/* Espaciador para asegurar scroll */}
							<div className="h-4" />
						</div>
					</div>

					{/* Botones de acción */}
					<div className="border-t px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:border-0 sm:px-6 sm:pb-0 sm:pt-5">
						<div className="flex gap-2 justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
								disabled={isVoiding}
							>
								Cancelar
							</Button>
							<Button type="submit" variant="destructive" disabled={!isReasonValid || isVoiding}>
								{isVoiding ? "Anulando..." : "Confirmar anulación"}
							</Button>
						</div>
					</div>
				</form>
			</ResponsiveDialogDrawer>
		</>
	);
}
