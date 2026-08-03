/**
 * Configuración de la navegación principal de Bodegix POS.
 * Centraliza las rutas de la barra de navegación para desktop y móvil.
 */

export interface NavItem {
	/** Ruta de TanStack Router */
	to: string;
	/** Etiqueta visible */
	label: string;
	/** Clave del ícono de HugeIcons */
	icon: string;
	/** Descripción accesible para aria-label */
	description: string;
}

/**
 * Navegación principal. Orden deliberado para el flujo de trabajo diario:
 * 1. Venta (pantalla de trabajo principal)
 * 2. Productos (catálogo)
 * 3. Inventario (stock)
 * 4. Caja (apertura/cierre)
 * 5. Resumen (reportes diarios)
 * 6. Configuración
 */
export const PRIMARY_NAV: readonly NavItem[] = [
	{
		to: "/sale",
		label: "Venta",
		icon: "ShoppingCartCheckIn02Icon",
		description: "Punto de venta",
	},
	{
		to: "/products",
		label: "Productos",
		icon: "DeliveryBox02Icon",
		description: "Catálogo de productos",
	},
	{
		to: "/inventory",
		label: "Inventario",
		icon: "PackageSentIcon",
		description: "Control de inventario",
	},
	{
		to: "/cash",
		label: "Caja",
		icon: "CashPaymentIcon",
		description: "Gestión de caja",
	},
	{
		to: "/summary",
		label: "Resumen",
		icon: "AnalyticsUpIcon",
		description: "Resumen y reportes diarios",
	},
	{
		to: "/settings",
		label: "Ajustes",
		icon: "Settings02Icon",
		description: "Configuración de la bodega",
	},
] as const;
