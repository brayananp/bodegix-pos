import { formatMoney } from "@/shared/kernel/money";

export function formatCashDate(timestamp: number): string {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(new Date(timestamp));
}

export function formatSignedMoney(value: number): string {
	if (value === 0) return formatMoney(0);
	return `${value > 0 ? "+" : "−"}${formatMoney(Math.abs(value))}`;
}
