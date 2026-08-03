import { cn } from "@/shared/lib/utils";
import {
	AnalyticsUpIcon,
	DeliveryBox02Icon,
	PackageSentIcon,
	Payment02Icon,
	Settings02Icon,
	ShoppingCartCheckIn02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { NavItem } from "./nav-config";
import { PRIMARY_NAV } from "./nav-config";

const ICON_MAP = {
	ShoppingCartCheckIn02Icon,
	DeliveryBox02Icon,
	PackageSentIcon,
	Payment02Icon,
	AnalyticsUpIcon,
	Settings02Icon,
} as const;

type IconKey = keyof typeof ICON_MAP;

interface AppSidebarProps {
	className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	return (
		<aside
			className={cn(
				"hidden md:flex md:flex-col md:w-56 lg:w-64 md:border-r md:border-border",
				"bg-sidebar text-sidebar-foreground min-h-screen shrink-0",
				className,
			)}
			aria-label="Navegación principal"
		>
			{/* Logo / Nombre */}
			<div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
				<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm select-none">
					B
				</div>
				<div>
					<p className="font-semibold text-sm leading-tight">Bodegix</p>
					<p className="text-xs text-sidebar-foreground/60 leading-tight">Punto de Venta</p>
				</div>
			</div>

			{/* Navegación */}
			<nav className="flex flex-col gap-1 p-3 flex-1" aria-label="Menú principal">
				{PRIMARY_NAV.map((item) => (
					<SidebarNavItem
						key={item.to}
						item={item}
						isActive={
							currentPath === item.to || (item.to !== "/" && currentPath.startsWith(item.to))
						}
					/>
				))}
			</nav>

			{/* Estado de conexión — renderizado en shell, logic en cliente */}
			<div className="p-4 border-t border-sidebar-border">
				<ConnectionBadge />
			</div>
		</aside>
	);
}

function SidebarNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
	const IconComponent = ICON_MAP[item.icon as IconKey];

	return (
		<Link
			to={item.to}
			aria-label={item.description}
			aria-current={isActive ? "page" : undefined}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
				"transition-colors duration-150",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
				"min-h-[44px]", // objetivo táctil mínimo
				isActive
					? "bg-sidebar-primary text-sidebar-primary-foreground"
					: "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
			)}
		>
			{IconComponent && (
				<HugeiconsIcon
					icon={IconComponent}
					className="size-5 shrink-0"
					strokeWidth={isActive ? 2.5 : 2}
					aria-hidden="true"
				/>
			)}
			<span>{item.label}</span>
		</Link>
	);
}

function ConnectionBadge() {
	// El estado real se gestiona en AppShell con useOnlineStatus
	// Este componente solo muestra el slot — se hidrata en cliente
	return (
		<div
			id="connection-badge"
			className="flex items-center gap-2 text-xs text-sidebar-foreground/60"
			aria-live="polite"
			aria-atomic="true"
		>
			<span className="size-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
			<span>Conectado</span>
		</div>
	);
}
