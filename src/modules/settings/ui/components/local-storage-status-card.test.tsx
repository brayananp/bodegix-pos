import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocalDatabaseProvider } from "@/app/providers/local-database-provider";
import type {
	DatabaseDiagnosticReport,
	StorageManagerAdapter,
} from "@/shared/infrastructure/local-db";
import { LocalStorageStatusCard } from "./local-storage-status-card";

const passReport: DatabaseDiagnosticReport = {
	status: "pass",
	mode: "basic",
	checkedAt: 1,
	checks: [{ id: "database-open", status: "pass", message: "ok" }],
};

function renderCard(
	storageAdapter: StorageManagerAdapter,
	diagnostics: DatabaseDiagnosticReport = passReport,
	diagnose = vi.fn().mockResolvedValue(diagnostics),
) {
	return render(
		<LocalDatabaseProvider
			initialize={() =>
				Promise.resolve({
					databaseName: "bodegix-test",
					schemaVersion: 1,
					installationId: "12345678-abcd-efgh-9876",
					createdSettings: true,
					diagnostics,
				})
			}
			diagnose={diagnose}
		>
			<LocalStorageStatusCard storageAdapter={storageAdapter} />
		</LocalDatabaseProvider>,
	);
}

describe("LocalStorageStatusCard", () => {
	it("muestra almacenamiento compatible y diagnóstico aprobado", async () => {
		renderCard({
			getStorageStatus: vi.fn().mockResolvedValue({
				supported: true,
				persistenceSupported: true,
				persisted: true,
				usageBytes: 1024,
				quotaBytes: 4096,
				usagePercentage: 25,
			}),
			requestPersistentStorage: vi.fn(),
		});

		expect(await screen.findByText("Almacenamiento local")).toBeInTheDocument();
		expect(await screen.findByText("Concedida")).toBeInTheDocument();
		expect(screen.getByText("Aprobado")).toBeInTheDocument();
		expect(screen.getByText("1.0 KB")).toBeInTheDocument();
	});

	it("muestra degradación cuando StorageManager no está disponible", async () => {
		renderCard({
			getStorageStatus: vi.fn().mockResolvedValue({
				supported: false,
				persistenceSupported: false,
				persisted: null,
				usageBytes: null,
				quotaBytes: null,
				usagePercentage: null,
			}),
			requestPersistentStorage: vi.fn(),
		});

		expect(await screen.findByText("API no disponible")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Solicitar persistencia" })).toBeDisabled();
	});

	it("solicita persistencia solo al pulsar el botón", async () => {
		const request = vi.fn().mockResolvedValue({
			supported: true,
			persistenceSupported: true,
			persisted: true,
			usageBytes: 0,
			quotaBytes: 100,
			usagePercentage: 0,
		});
		renderCard({
			getStorageStatus: vi.fn().mockResolvedValue({
				supported: true,
				persistenceSupported: true,
				persisted: false,
				usageBytes: 0,
				quotaBytes: 100,
				usagePercentage: 0,
			}),
			requestPersistentStorage: request,
		});

		const button = await screen.findByRole("button", { name: "Solicitar persistencia" });
		expect(request).not.toHaveBeenCalled();
		await userEvent.click(button);
		await waitFor(() => expect(request).toHaveBeenCalledOnce());
		expect(await screen.findByText("Concedida")).toBeInTheDocument();
	});

	it("vuelve a ejecutar el diagnóstico y muestra una advertencia", async () => {
		const warningReport: DatabaseDiagnosticReport = {
			status: "warning",
			mode: "deep",
			checkedAt: 2,
			checks: [{ id: "orphan", status: "warning", message: "huérfano" }],
		};
		const diagnose = vi.fn().mockResolvedValue(warningReport);
		renderCard(
			{
				getStorageStatus: vi.fn().mockResolvedValue({
					supported: true,
					persistenceSupported: true,
					persisted: false,
					usageBytes: null,
					quotaBytes: null,
					usagePercentage: null,
				}),
				requestPersistentStorage: vi.fn(),
			},
			passReport,
			diagnose,
		);

		await userEvent.click(
			await screen.findByRole("button", { name: "Ejecutar diagnóstico profundo" }),
		);
		await waitFor(() => expect(diagnose).toHaveBeenCalledWith("deep"));
		expect(await screen.findByText("Con advertencias")).toBeInTheDocument();
	});
});
