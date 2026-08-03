import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";

export function FormError({ message }: { message?: string | null }) {
	if (!message) return null;
	return (
		<Alert variant="destructive" role="alert" aria-live="assertive">
			<AlertTitle>No se pudo guardar</AlertTitle>
			<AlertDescription>{message}</AlertDescription>
		</Alert>
	);
}
