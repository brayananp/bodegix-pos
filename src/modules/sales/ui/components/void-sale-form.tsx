import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { VOID_REASON_MAX_LENGTH, VOID_REASON_MIN_LENGTH } from "../../domain";
import { useVoidSaleAction } from "../hooks";

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
 */
export function VoidSaleForm({ saleId, saleNumber, onSuccess }: VoidSaleFormProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [reason, setReason] = useState("");
	const { isVoiding, executeVoid } = useVoidSaleAction();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const success = await executeVoid(saleId, reason);
		if (success) {
			setIsDialogOpen(false);
			setReason("");
			onSuccess();
		}
	};

	const isReasonValid = reason.trim().length >= VOID_REASON_MIN_LENGTH;
	const remainingChars = VOID_REASON_MAX_LENGTH - reason.length;

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger>
				<Button variant="destructive" className="w-full" type="button">
					<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
					Anular venta
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Anular Venta #{saleNumber}</DialogTitle>
						<DialogDescription>
							Esta acción no se puede deshacer. La venta se marcará como anulada y el stock será
							devuelto a los productos.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Advertencias */}
						<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2">
							<p className="text-sm font-semibold text-destructive">Confirma que:</p>
							<ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
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
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
							disabled={isVoiding}
						>
							Cancelar
						</Button>
						<Button type="submit" variant="destructive" disabled={!isReasonValid || isVoiding}>
							{isVoiding ? "Anulando..." : "Confirmar anulación"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
