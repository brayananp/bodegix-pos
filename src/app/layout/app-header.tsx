import { useOnlineStatus } from "@/shared/kernel/network/use-online-status";
import { cn } from "@/shared/lib/utils";

/**
 * OfflineBadge — indicador de estado sin conexión.
 * Se usa en el topbar del AppShell y como componente standalone en tests.
 */
export function OfflineBadge({ isOnline }: { isOnline: boolean }) {
	if (isOnline) return null;

	return (
		<output
			className={cn(
				"flex items-center gap-1.5 rounded-full px-2.5 py-1",
				"bg-destructive/10 text-destructive text-xs font-medium",
			)}
			aria-live="polite"
			aria-label="Sin conexión a internet"
		>
			<span className="size-1.5 rounded-full bg-destructive shrink-0" aria-hidden="true" />
			<span>Sin conexión</span>
		</output>
	);
}

/**
 * MobileOfflineBanner — banner visible en móvil cuando está sin conexión.
 * Se coloca encima del contenido de la página.
 */
export function MobileOfflineBanner() {
	const isOnline = useOnlineStatus();
	if (isOnline) return null;

	return (
		<output
			className="md:hidden flex items-center justify-center gap-2 bg-destructive/10 text-destructive text-xs font-medium py-2 px-4"
			aria-live="polite"
		>
			<span className="size-1.5 rounded-full bg-destructive shrink-0" aria-hidden="true" />
			Sin conexión — los datos se guardan localmente
		</output>
	);
}
