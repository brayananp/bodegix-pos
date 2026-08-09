/**
 * Configuración de la navegación principal de Bodegix POS.
 * Centraliza las rutas y los metadatos de cada ítem de navegación.
 */

import {
	AnalyticsUpIcon,
	DeliveryBox02Icon,
	PackageSentIcon,
	Payment02Icon,
	Settings02Icon,
	ShoppingBag03Icon,
	ShoppingCartCheckIn02Icon,
} from "@hugeicons/core-free-icons";
import type { HugeiconsIconProps } from "@hugeicons/react";

export interface NavItem {
	to: string;
	label: string;
	description: string;
	icon: HugeiconsIconProps["icon"];
}

/**
 * Evita colisiones entre rutas hermanas con el mismo prefijo, como
 * `/sale` y `/sales`, sin perder el estado activo de rutas hijas reales.
 */
export function isNavItemActive(currentPath: string, itemPath: string) {
	return currentPath === itemPath || (itemPath !== "/" && currentPath.startsWith(`${itemPath}/`));
}

/**
 * Navegación principal ordenada por frecuencia de uso diario.
 */
export const PRIMARY_NAV: readonly NavItem[] = [
	{
		to: "/sale",
		label: "Venta",
		description: "Punto de venta",
		icon: ShoppingCartCheckIn02Icon,
	},
	{
		to: "/sales",
		label: "Historial",
		description: "Historial de ventas",
		icon: ShoppingBag03Icon,
	},
	{
		to: "/products",
		label: "Productos",
		description: "Catálogo de productos",
		icon: DeliveryBox02Icon,
	},
	{
		to: "/inventory",
		label: "Inventario",
		description: "Control de inventario",
		icon: PackageSentIcon,
	},
	{
		to: "/cash",
		label: "Caja",
		description: "Gestión de caja",
		icon: Payment02Icon,
	},
	{
		to: "/summary",
		label: "Resumen",
		description: "Resumen y reportes diarios",
		icon: AnalyticsUpIcon,
	},
] as const;

export const SECONDARY_NAV: readonly NavItem[] = [
	{
		to: "/settings",
		label: "Configuración",
		description: "Ajustes de la bodega",
		icon: Settings02Icon,
	},
] as const;
