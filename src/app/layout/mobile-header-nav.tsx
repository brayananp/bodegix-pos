import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { isNavItemActive, MOBILE_HEADER_NAV } from "./nav-config";

export function MobileHeaderNav() {
	const currentPath = useRouterState({ select: (state) => state.location.pathname });

	return (
		<nav aria-label="Accesos secundarios" className="flex items-center gap-1 md:hidden">
			{MOBILE_HEADER_NAV.map((item) => {
				const active = isNavItemActive(currentPath, item.to);

				return (
					<Link
						key={item.to}
						to={item.to}
						aria-label={item.description}
						aria-current={active ? "page" : undefined}
						className={cn(
							buttonVariants({ variant: active ? "secondary" : "ghost", size: "icon-sm" }),
							active && "active",
						)}
					>
						<HugeiconsIcon
							icon={item.icon}
							data-icon="inline-start"
							strokeWidth={active ? 2.5 : 2}
						/>
					</Link>
				);
			})}
		</nav>
	);
}
