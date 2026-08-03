import { Link } from "@tanstack/react-router";
import { useCashStatus } from "../hooks/use-cash-queries";

export function CashStatusIndicator() {
	const status = useCashStatus();
	return (
		<Link
			to="/cash"
			search={{ tab: "current", panel: null, sessionId: null, page: 1, pageSize: 25 }}
			className="hidden min-h-8 items-center gap-2 rounded-full border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted md:flex"
			aria-label="Ir a caja"
		>
			<span
				className={
					status.data?.isOpen
						? "size-2 rounded-full bg-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
						: "size-2 rounded-full bg-muted-foreground/50"
				}
				aria-hidden="true"
			/>
			{status.isLoading
				? "Consultando caja"
				: status.error
					? "Caja no disponible"
					: status.data?.isOpen
						? "Caja abierta"
						: "Caja cerrada"}
		</Link>
	);
}
