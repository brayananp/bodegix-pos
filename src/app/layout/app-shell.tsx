import { Separator } from "@/shared/components/ui/separator";
import { OfflineBanner, usePwa } from "@/app/pwa";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar";
import { CashStatusIndicator } from "@/modules/cash/ui/components/cash-status-indicator";
import { AppSidebar } from "./app-sidebar";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
	children: React.ReactNode;
	/** Título de la página actual — se muestra en el breadcrumb del header */
	pageTitle?: string;
}

/**
 * Shell principal de Bodegix POS.
 *
 * Desktop: usa SidebarProvider + Sidebar colapsable con rail + SidebarInset
 * Móvil:   sidebar como Sheet (comportamiento nativo del componente) + BottomNav
 *
 * El SidebarProvider persiste el estado collapse en una cookie para que
 * el servidor pueda renderizar el estado correcto sin flash.
 */
export function AppShell({ children, pageTitle }: AppShellProps) {
	const pwa = usePwa();
	const isOnline = pwa.browserOnline;

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar />

			<SidebarInset>
				{/* ── Top bar ──────────────────────────────────────────── */}
				<header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					{/* Trigger — visible en desktop y móvil */}
					<SidebarTrigger className="-ml-1" />
					<div className="">
						<Separator orientation="vertical" className="mr-2 h-4" />
					</div>

					{/* Título de página */}
					{pageTitle && (
						<span className="text-sm font-medium text-foreground truncate">{pageTitle}</span>
					)}

					{/* Spacer */}
					<div className="flex-1" />
					<CashStatusIndicator />

					{/* Badge offline — solo si está sin conexión */}
					{!isOnline && (
						<output
							className="hidden md:flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
							aria-live="polite"
						>
							<span className="size-1.5 rounded-full bg-destructive" aria-hidden="true" />
							Sin conexión
						</output>
					)}
				</header>
				<OfflineBanner />
				{pwa.serviceWorker.updateAvailable && pwa.updatePostponed && (
					<button
						type="button"
						className="border-b bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
						onClick={pwa.showUpdatePrompt}
					>
						Nueva versión disponible · Ver actualización
					</button>
				)}

				{/* ── Contenido principal ──────────────────────────────── */}
				{/* pb-16 en móvil deja espacio para la BottomNav fija */}
				<div className="flex flex-1 flex-col gap-4 pb-16 md:pb-0">{children}</div>
			</SidebarInset>

			{/* ── Navegación inferior — solo móvil ─────────────────── */}
			<BottomNav />
		</SidebarProvider>
	);
}
