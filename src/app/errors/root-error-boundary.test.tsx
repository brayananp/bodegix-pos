import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RootErrorBoundary } from "./root-error-boundary";

const invalidate = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-router")>()),
	useRouter: () => ({ invalidate }),
}));

describe("RootErrorBoundary", () => {
	beforeEach(() => invalidate.mockReset());

	it("ofrece recuperación segura y una referencia sin mostrar detalles internos", async () => {
		const error = new Error("secret internal detail");
		render(<RootErrorBoundary error={error} info={{ componentStack: "" }} reset={vi.fn()} />);

		expect(screen.getByText("Tus datos locales no fueron borrados")).toBeInTheDocument();
		expect(screen.queryByText(/secret internal detail/i)).not.toBeInTheDocument();
		expect(screen.getByText(/^Referencia: ERR-[0-9A-F]{8}$/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Abrir Configuración" })).toHaveAttribute(
			"href",
			"/settings",
		);

		await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
		expect(invalidate).toHaveBeenCalledOnce();
	});
});
