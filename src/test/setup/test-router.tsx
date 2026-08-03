/**
 * Wrapper de router para tests de componentes.
 * Usa MemoryHistory de TanStack Router para no depender del navegador.
 */
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { act, render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Renderiza un componente dentro de un RouterProvider con MemoryHistory.
 * Útil para testar componentes que usan hooks de TanStack Router.
 *
 * Usa `act` para resolver las transiciones asíncronas del router.
 */
export async function renderWithRouter(
	ui: ReactElement,
	{ initialPath = "/" }: { initialPath?: string } = {},
): Promise<RenderResult> {
	const rootRoute = createRootRoute({ component: Outlet });
	const testRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: initialPath,
		component: () => ui,
	});

	const routeTree = rootRoute.addChildren([testRoute]);
	const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });

	const router = createRouter({ routeTree, history: memoryHistory });

	let result!: RenderResult;

	await act(async () => {
		result = render(<RouterProvider router={router} />);
		// Esperar a que el router resuelva la ruta inicial
		await router.load();
	});

	return result;
}
