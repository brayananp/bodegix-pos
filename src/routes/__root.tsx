import { AppShell } from "@/app/layout/app-shell";
import { RootErrorBoundary } from "@/app/errors/root-error-boundary";
import { PwaProvider } from "@/app/pwa";
import { LocalDatabaseProvider } from "@/app/providers/local-database-provider";
import { DatabaseMaintenanceProvider } from "@/app/providers/database-maintenance-provider";
import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
			{ title: "Bodegix POS" },
			{
				name: "description",
				content: "PWA offline-first de ventas, caja e inventario para bodegas.",
			},
			{ name: "theme-color", content: "#16a34a" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/manifest.webmanifest" },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
		],
	}),
	shellComponent: RootDocument,
	errorComponent: RootErrorBoundary,
	notFoundComponent: NotFoundPage,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es-PE" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<TooltipProvider delay={500}>
						<PwaProvider>
							<LocalDatabaseProvider>
								<DatabaseMaintenanceProvider>
									{children}
									<Toaster position="top-right" richColors closeButton />
								</DatabaseMaintenanceProvider>
							</LocalDatabaseProvider>
						</PwaProvider>
					</TooltipProvider>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}

function NotFoundPage() {
	return (
		<AppShell>
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
				<div className="text-6xl font-bold text-muted-foreground/30">404</div>
				<h1 className="text-xl font-semibold">Página no encontrada</h1>
				<p className="text-sm text-muted-foreground max-w-sm">
					La ruta que buscas no existe. Usa la navegación para volver al punto de venta.
				</p>
				<a
					href="/sale"
					className="text-sm text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
				>
					Ir a Venta
				</a>
			</div>
		</AppShell>
	);
}

// Layout global que envuelve todas las rutas dentro del shell
export function GlobalLayout() {
	return (
		<AppShell>
			<Outlet />
		</AppShell>
	);
}
