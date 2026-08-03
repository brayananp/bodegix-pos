import { useOnlineStatus } from "@/shared/kernel/network/use-online-status";
import { cn } from "@/shared/lib/utils";
import { AppSidebar } from "./app-sidebar";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
	children: React.ReactNode;
}

/**
 * Shell principal de la aplicación.
 *
 * Desktop: sidebar izquierdo + contenido principal
 * Móvil:   encabezado fijo + contenido + barra inferior
 *
 * El estado de conexión se detecta aquí y se pasa al sidebar
 * para actualizar el badge de conexión con CSS.
 */
export function AppShell({ children }: AppShellProps) {
	const isOnline = useOnlineStatus();

	return (
		<div className="flex min-h-screen bg-background">
			{/* Sidebar — solo desktop */}
			<AppSidebar />

			{/* Contenido principal */}
			<div className="flex flex-col flex-1 min-w-0">
				{/* Banner offline — desktop */}
				{!isOnline && (
					<output
						className={cn(
							"hidden md:flex items-center justify-center gap-2",
							"bg-destructive/10 text-destructive text-xs font-medium py-1.5 px-4",
						)}
						aria-live="polite"
					>
						<span className="size-1.5 rounded-full bg-destructive shrink-0" aria-hidden="true" />
						Sin conexión — los datos se guardan localmente
					</output>
				)}

				{/* Área de contenido con padding para barra inferior en móvil */}
				<main className="flex-1 pb-[env(safe-area-inset-bottom)] md:pb-0" id="main-content">
					{/* Padding inferior para dejar espacio a la BottomNav en móvil */}
					<div className="pb-16 md:pb-0 min-h-full">{children}</div>
				</main>
			</div>

			{/* Barra de navegación inferior — solo móvil */}
			<BottomNav />
		</div>
	);
}
