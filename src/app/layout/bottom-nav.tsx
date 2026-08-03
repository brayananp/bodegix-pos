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

/**
 * Navegación inferior para móvil.
 * Muestra las primeras 5 rutas; "Ajustes" queda en la quinta posición.
 * Diseño mobile-first con objetivos táctiles de al menos 44px.
 */
export function BottomNav() {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	return (
		<nav
			className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom"
			aria-label="Navegación principal"
		>
			<ul className="flex items-stretch">
				{PRIMARY_NAV.map((item) => {
					const isActive =
						currentPath === item.to || (item.to !== "/" && currentPath.startsWith(item.to));
					return (
						<li key={item.to} className="flex-1">
							<BottomNavItem item={item} isActive={isActive} />
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

function BottomNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
	const IconComponent = ICON_MAP[item.icon as IconKey];

	return (
		<Link
			to={item.to}
			aria-label={item.description}
			aria-current={isActive ? "page" : undefined}
			className={cn(
				"flex flex-col items-center justify-center gap-1 py-2 px-1 w-full",
				"text-xs font-medium min-h-[56px]",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
				"transition-colors duration-150",
				isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
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
			<span className="leading-none truncate max-w-full">{item.label}</span>
		</Link>
	);
}
