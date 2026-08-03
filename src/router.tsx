import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Crea la instancia del router para Bodegix POS.
 *
 * Configuración SPA:
 * - defaultPreload: "intent" — precarga al hover/focus de links
 * - scrollRestoration: true — restaura posición de scroll al navegar
 * - defaultPreloadStaleTime: 0 — siempre re-evalúa loaders al precargar
 *
 * Para despliegue estático (SPA mode) se requiere configurar el servidor
 * para que redirija todas las rutas al index.html:
 * - Nginx:   try_files $uri $uri/ /index.html;
 * - Apache:  FallbackResource /index.html
 * - Vercel/Netlify: rewrites a /* → /index.html
 *
 * Ver docs/deployment.md para instrucciones por plataforma.
 */
export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
