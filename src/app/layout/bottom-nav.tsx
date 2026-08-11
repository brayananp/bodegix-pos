import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/shared/lib/utils";
import { isNavItemActive, MOBILE_BOTTOM_NAV } from "./nav-config";

/**
 * Barra de navegación inferior — solo visible en móvil (md:hidden).
 * Usa el sidebar shadcn como Sheet en pantallas pequeñas;
 * este componente provee la navegación rápida de acceso directo.
 */
export function BottomNav() {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	function isActive(to: string) {
		return isNavItemActive(currentPath, to);
	}

	return (
		<nav
			className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]"
			aria-label="Navegación principal"
		>
			<ul className="flex items-stretch">
				{MOBILE_BOTTOM_NAV.map((item) => {
					const active = isActive(item.to);
					return (
						<li key={item.to} className="flex-1">
							<Link
								to={item.to}
								aria-label={item.description}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex flex-col items-center justify-center gap-1 py-2 px-1 w-full min-h-14",
									"text-xs font-medium transition-colors duration-150",
									"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
									active ? "text-primary" : "text-muted-foreground hover:text-foreground",
								)}
							>
								<HugeiconsIcon
									icon={item.icon}
									className="size-5 shrink-0"
									strokeWidth={active ? 2.5 : 2}
									aria-hidden="true"
								/>
								<span className="leading-none truncate max-w-full">{item.label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
