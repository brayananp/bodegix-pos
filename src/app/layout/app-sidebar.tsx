import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/shared/components/ui/sidebar";
import { useOnlineStatus } from "@/shared/kernel/network/use-online-status";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav-config";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const isOnline = useOnlineStatus();

	function isActive(to: string) {
		return currentPath === to || (to !== "/" && currentPath.startsWith(to));
	}

	return (
		<Sidebar role="complementary" aria-label="Navegación principal" collapsible="icon" {...props}>
			{/* ── Cabecera: logo + nombre ─────────────────────────── */}
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							className="cursor-default hover:bg-transparent active:bg-transparent"
						>
							<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm select-none">
								B
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">Bodegix</span>
								<span className="truncate text-xs text-muted-foreground">Punto de Venta</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			{/* ── Contenido: navegación principal ─────────────────── */}
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Operaciones</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{PRIMARY_NAV.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										isActive={isActive(item.to)}
										tooltip={item.label}
										render={
											<Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined}>
												<HugeiconsIcon
													icon={item.icon}
													className="size-4"
													strokeWidth={isActive(item.to) ? 2.5 : 2}
												/>
												<span>{item.label}</span>
											</Link>
										}
									></SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* ── Pie: configuración + estado de conexión ──────────── */}
			<SidebarFooter>
				<SidebarMenu>
					{SECONDARY_NAV.map((item) => (
						<SidebarMenuItem key={item.to}>
							<SidebarMenuButton
								isActive={isActive(item.to)}
								tooltip={item.label}
								render={
									<Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined}>
										<HugeiconsIcon
											icon={item.icon}
											className="size-4"
											strokeWidth={isActive(item.to) ? 2.5 : 2}
										/>
										<span>{item.label}</span>
									</Link>
								}
							></SidebarMenuButton>
						</SidebarMenuItem>
					))}

					{/* Estado de conexión */}
					<SidebarMenuItem>
						<div className="flex items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:justify-center">
							<span
								className={`size-2 rounded-full shrink-0 ${isOnline ? "bg-emerald-500" : "bg-destructive"}`}
								aria-hidden="true"
							/>
							<span className="group-data-[collapsible=icon]:hidden">
								{isOnline ? "Conectado" : "Sin conexión"}
							</span>
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
