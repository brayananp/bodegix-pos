import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Ruta raíz "/": redirige a "/sale".
 * La pantalla de venta es el punto de entrada principal de Bodegix POS.
 */
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({
			to: "/sale",
			search: { q: "", categoryId: null, panel: null, saleId: null },
		});
	},
	component: () => null,
});
