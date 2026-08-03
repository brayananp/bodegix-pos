import { useOnlineStatus } from "@/shared/kernel/network/use-online-status";
import { cn } from "@/shared/lib/utils";

interface AppHeaderProps {
	title: string;
	description?: string;
	actions?: React.ReactNode;
}

/**
 * Encabezado visible en móvil (md:hidden).
 * En desktop el sidebar cumple esta función.
 */
export function AppHeader({ title, description, actions }: AppHeaderProps) {
	const isOnline = useOnlineStatus();

	return (
		<header className="md:hidden flex items-center gap-3 px-4 py-3 bg-background border-b border-border sticky top-0 z-40">
			{/* Logo compacto */}
			<div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs select-none shrink-0">
				B
			</div>

			{/* Título de la página actual */}
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-sm leading-tight truncate">{title}</p>
				{description && (
					<p className="text-xs text-muted-foreground leading-tight truncate">{description}</p>
				)}
			</div>

			{/* Indicador de conexión */}
			<OfflineBadge isOnline={isOnline} />

			{/* Acciones opcionales */}
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</header>
	);
}

/**
 * Badge que indica estado offline.
 * Solo es visible cuando está sin conexión para no distraer.
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
