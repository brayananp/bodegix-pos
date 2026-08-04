import { useState } from "react";
import { toast } from "sonner";
import { voidSale } from "../../application";
import { isSaleError } from "../../domain";
import { getVoidSaleUnitOfWork } from "../../infrastructure";

/**
 * Hook para ejecutar la acción de anular una venta.
 *
 * @returns Estado y función para anular venta
 */
export function useVoidSaleAction() {
	const [isVoiding, setIsVoiding] = useState(false);

	const executeVoid = async (saleId: string, reason: string): Promise<boolean> => {
		setIsVoiding(true);
		try {
			const unitOfWork = getVoidSaleUnitOfWork();
			const result = await voidSale(unitOfWork, { saleId, reason });

			toast.success(`Venta #${result.saleNumber} anulada`, {
				description: `Se devolvieron ${result.itemsRestored} unidades al stock`,
			});

			return true;
		} catch (error) {
			if (isSaleError(error)) {
				toast.error("No se pudo anular la venta", {
					description: error.message,
				});
			} else {
				toast.error("Error inesperado", {
					description: "Ocurrió un error al anular la venta",
				});
			}
			return false;
		} finally {
			setIsVoiding(false);
		}
	};

	return { isVoiding, executeVoid };
}
