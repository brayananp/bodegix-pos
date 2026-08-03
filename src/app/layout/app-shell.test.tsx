/**
 * Pruebas de componente del layout principal de Bodegix POS.
 */
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

describe("AppSidebar", () => {
	it("renderiza el nombre de la app", async () => {
		await renderWithRouter(<AppSidebar />);
		expect(screen.getByText("Bodegix")).toBeInTheDocument();
	});

	it("renderiza los labels de navegación visibles", async () => {
		await renderWithRouter(<AppSidebar />);
		expect(screen.getByText("Venta")).toBeInTheDocument();
		expect(screen.getByText("Productos")).toBeInTheDocument();
		expect(screen.getByText("Inventario")).toBeInTheDocument();
		expect(screen.getByText("Caja")).toBeInTheDocument();
		expect(screen.getByText("Resumen")).toBeInTheDocument();
		expect(screen.getByText("Ajustes")).toBeInTheDocument();
	});

	it("tiene un elemento aside con aria-label de navegación", async () => {
		await renderWithRouter(<AppSidebar />);
		const sidebar = screen.getByRole("complementary", {
			name: /Navegación principal/i,
		});
		expect(sidebar).toBeInTheDocument();
	});

	it("los links tienen aria-label accesibles", async () => {
		await renderWithRouter(<AppSidebar />);
		expect(screen.getByRole("link", { name: /Punto de Venta/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Catálogo de productos/i })).toBeInTheDocument();
	});
});

describe("BottomNav", () => {
	it("renderiza la barra de navegación inferior", async () => {
		await renderWithRouter(<BottomNav />);
		const nav = screen.getByRole("navigation", {
			name: /Navegación principal/i,
		});
		expect(nav).toBeInTheDocument();
	});

	it("muestra los labels de los ítems de navegación", async () => {
		await renderWithRouter(<BottomNav />);
		expect(screen.getByText("Venta")).toBeInTheDocument();
		expect(screen.getByText("Productos")).toBeInTheDocument();
		expect(screen.getByText("Inventario")).toBeInTheDocument();
		expect(screen.getByText("Caja")).toBeInTheDocument();
		expect(screen.getByText("Resumen")).toBeInTheDocument();
	});
});

describe("OfflineBadge", () => {
	it("no renderiza nada cuando está online", () => {
		const { container } = render(<OfflineBadge isOnline={true} />);
		expect(container.firstChild).toBeNull();
	});

	it("muestra badge cuando está offline", () => {
		render(<OfflineBadge isOnline={false} />);
		expect(screen.getByText(/Sin conexión/i)).toBeInTheDocument();
	});

	it("tiene role=status cuando está offline", () => {
		render(<OfflineBadge isOnline={false} />);
		expect(screen.getByRole("status")).toBeInTheDocument();
	});
});
