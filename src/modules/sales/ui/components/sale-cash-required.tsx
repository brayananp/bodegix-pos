import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export function SaleCashRequired() {
	const navigate = useNavigate();

	return (
		<Alert role="status" aria-live="polite">
			<AlertTitle>Caja cerrada</AlertTitle>
			<AlertDescription className="space-y-3">
				<p>Puedes preparar el carrito, pero necesitas una caja abierta para confirmar la venta.</p>
				<Button
					type="button"
					size="sm"
					onClick={() =>
						void navigate({
							to: "/cash",
							search: { tab: "current", panel: "open", sessionId: null, page: 1, pageSize: 25 },
						})
					}
				>
					Abrir caja
				</Button>
			</AlertDescription>
		</Alert>
	);
}
