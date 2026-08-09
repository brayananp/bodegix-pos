import type { PaymentMethod } from "../domain";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
	cash: "Efectivo",
	yape: "Yape",
	plin: "Plin",
	card: "Tarjeta",
	bank_transfer: "Transferencia",
};

export function formatSalesDate(timestamp: number): string {
	return new Intl.DateTimeFormat("es-PE", {
		timeZone: "America/Lima",
		dateStyle: "medium",
		timeStyle: "short",
	}).format(timestamp);
}

export function paymentConfirmationLabel(method: PaymentMethod, amount: string): string {
	if (method === "cash") return `Confirmo que devolví ${amount} en efectivo.`;
	if (method === "yape" || method === "plin") {
		return `Confirmo que anulé o devolví ${amount} desde la aplicación oficial.`;
	}
	if (method === "card") {
		return `Confirmo que anulé o devolví ${amount} desde el terminal o proveedor oficial.`;
	}
	return `Confirmo que gestioné la devolución de ${amount} por el canal bancario.`;
}
