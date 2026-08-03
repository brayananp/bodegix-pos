import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	LocalDatabaseError,
	type DatabaseDiagnosticReport,
} from "@/shared/infrastructure/local-db";
import { LocalDatabaseProvider } from "./local-database-provider";

const passDiagnostics: DatabaseDiagnosticReport = {
	status: "pass",
	mode: "basic",
	checkedAt: 1,
	checks: [],
};

const readyResult = {
	databaseName: "test-db",
	schemaVersion: 1,
	installationId: "installation-test",
	createdSettings: true,
	diagnostics: passDiagnostics,
};

describe("LocalDatabaseProvider", () => {
	it("muestra el estado inicializando", () => {
		render(
			<LocalDatabaseProvider initialize={() => new Promise(() => {})}>
				<div>Aplicación</div>
			</LocalDatabaseProvider>,
		);
		expect(screen.getByText("Preparando almacenamiento local…")).toBeInTheDocument();
		expect(screen.queryByText("Aplicación")).not.toBeInTheDocument();
	});

	it("monta la aplicación cuando la base está lista", async () => {
		render(
			<LocalDatabaseProvider initialize={() => Promise.resolve(readyResult)}>
				<div>Aplicación lista</div>
			</LocalDatabaseProvider>,
		);
		expect(await screen.findByText("Aplicación lista")).toBeInTheDocument();
	});

	it("muestra un error seguro cuando falla", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		render(
			<LocalDatabaseProvider
				initialize={() => Promise.reject(new LocalDatabaseError("DATABASE_OPEN_FAILED"))}
			>
				<div>Aplicación</div>
			</LocalDatabaseProvider>,
		);
		expect(
			await screen.findByText("No se pudo abrir el almacenamiento local."),
		).toBeInTheDocument();
		expect(screen.queryByText("Aplicación")).not.toBeInTheDocument();
	});

	it("sale de initializing cuando se agota el tiempo", async () => {
		render(
			<LocalDatabaseProvider initialize={() => new Promise(() => {})} initializationTimeoutMs={1}>
				<div>Aplicación</div>
			</LocalDatabaseProvider>,
		);
		expect(
			await screen.findByText("No se pudo inicializar el almacenamiento local."),
		).toBeInTheDocument();
	});

	it("permite reintentar de forma controlada", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		const initialize = vi
			.fn()
			.mockRejectedValueOnce(new LocalDatabaseError("DATABASE_OPEN_FAILED"))
			.mockResolvedValueOnce(readyResult);
		render(
			<LocalDatabaseProvider initialize={initialize}>
				<div>Recuperada</div>
			</LocalDatabaseProvider>,
		);

		fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
		await waitFor(() => expect(initialize).toHaveBeenCalledTimes(2));
		expect(await screen.findByText("Recuperada")).toBeInTheDocument();
	});
});
