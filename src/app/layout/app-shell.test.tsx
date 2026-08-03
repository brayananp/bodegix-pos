import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { renderWithRouter } from "@/test/setup/test-router";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineBadge } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { BottomNav } from "./bottom-nav";

vi.mock("@/shared/kernel/network/use-online-status", () => ({
	useOnlineStatus: vi.fn(() => true),
}));

afterEach(() => {
	vi.clearAllMocks();
});

/**
 * AppSidebar requiere SidebarProvider en el árbol para leer el contexto.
 * Lo envolvemos en el wrapper del router.
 */
function SidebarWrapper({ children }: { children: React.ReactNode }) {
	return <SidebarProvider>{children}</SidebarProvider>;
}

describe("AppSidebar", () => {
	it("renderiza los labels de navegación visibles", async () => {
		await renderWithRouter(
			<SidebarWrapper>
				<AppSidebar />
			</SidebarWrapper>,
		);
		expect(screen.getByText("Venta")).toBeInTheDocument();
		expect(screen.getByText("Productos")).toBeInTheDocument();
		expect(screen.getByText("Inventario")).toBeInTheDocument();
		expect(screen.getByText("Caja")).toBeInTheDocument();
		expect(screen.getByText("Resumen")).toBeInTheDocument();
		expect(screen.getByText("Configuración")).toBeInTheDocument();
	});

	it("renderiza el nombre Bodegix", async () => {
		await renderWithRouter(
			<SidebarWrapper>
				<AppSidebar />
			</SidebarWrapper>,
		);
		expect(screen.getByText("Bodegix")).toBeInTheDocument();
	});

	it("renderiza el subtítulo Punto de Venta", async () => {
		await renderWithRouter(
			<SidebarWrapper>
				<AppSidebar />
			</SidebarWrapper>,
		);
		expect(screen.getByText("Punto de Venta")).toBeInTheDocument();
	});
});

describe("BottomNav", () => {
	it("renderiza la barra de navegación inferior", async () => {
		await renderWithRouter(<BottomNav />);
		const nav = screen.getByRole("navigation", { name: /Navegación principal/i });
		expect(nav).toBeInTheDocument();
	});

	it("muestra todos los ítems de navegación en móvil", async () => {
		await renderWithRouter(<BottomNav />);
		expect(screen.getByText("Venta")).toBeInTheDocument();
		expect(screen.getByText("Productos")).toBeInTheDocument();
		expect(screen.getByText("Inventario")).toBeInTheDocument();
		expect(screen.getByText("Caja")).toBeInTheDocument();
		expect(screen.getByText("Resumen")).toBeInTheDocument();
		expect(screen.getByText("Configuración")).toBeInTheDocument();
	});
});

describe("OfflineBadge", () => {
	it("no renderiza nada cuando está online", () => {
		const { container } = render(<OfflineBadge isOnline={true} />);
		expect(container.firstChild).toBeNull();
	});

	it("muestra el badge cuando está offline", () => {
		render(<OfflineBadge isOnline={false} />);
		expect(screen.getByText(/Sin conexión/i)).toBeInTheDocument();
	});

	it("usa el elemento output para accesibilidad", () => {
		const { container } = render(<OfflineBadge isOnline={false} />);
		expect(container.querySelector("output")).toBeInTheDocument();
	});
});
