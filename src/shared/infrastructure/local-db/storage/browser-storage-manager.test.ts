import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStorageStatus, requestPersistentStorage } from "./browser-storage-manager";

let originalStorageDescriptor: PropertyDescriptor | undefined;

function installStorage(storage: Partial<StorageManager> | undefined): void {
	Object.defineProperty(navigator, "storage", {
		configurable: true,
		value: storage,
	});
}

beforeEach(() => {
	originalStorageDescriptor = Object.getOwnPropertyDescriptor(navigator, "storage");
});

afterEach(() => {
	vi.restoreAllMocks();
	if (originalStorageDescriptor) {
		Object.defineProperty(navigator, "storage", originalStorageDescriptor);
	} else {
		Reflect.deleteProperty(navigator, "storage");
	}
});

describe("StorageManager del navegador", () => {
	it("lee persistencia, uso, cuota y porcentaje", async () => {
		installStorage({
			persist: vi.fn().mockResolvedValue(true),
			persisted: vi.fn().mockResolvedValue(true),
			estimate: vi.fn().mockResolvedValue({ usage: 25, quota: 100 }),
		});

		await expect(getStorageStatus()).resolves.toEqual({
			supported: true,
			persistenceSupported: true,
			persisted: true,
			usageBytes: 25,
			quotaBytes: 100,
			usagePercentage: 25,
		});
	});

	it("refleja una solicitud concedida", async () => {
		const persist = vi.fn().mockResolvedValue(true);
		installStorage({
			persist,
			persisted: vi.fn().mockResolvedValue(true),
			estimate: vi.fn().mockResolvedValue({ usage: 1, quota: 2 }),
		});

		const status = await requestPersistentStorage();
		expect(persist).toHaveBeenCalledOnce();
		expect(status.persisted).toBe(true);
	});

	it("trata una solicitud rechazada como estado válido", async () => {
		installStorage({
			persist: vi.fn().mockResolvedValue(false),
			persisted: vi.fn().mockResolvedValue(false),
			estimate: vi.fn().mockResolvedValue({}),
		});

		const status = await requestPersistentStorage();
		expect(status.persisted).toBe(false);
		expect(status.supported).toBe(true);
	});

	it("maneja estimate sin valores", async () => {
		installStorage({ estimate: vi.fn().mockResolvedValue({}) });
		const status = await getStorageStatus();
		expect(status.usageBytes).toBeNull();
		expect(status.quotaBytes).toBeNull();
		expect(status.usagePercentage).toBeNull();
	});

	it("degrada cuando la API no está soportada", async () => {
		installStorage(undefined);
		await expect(getStorageStatus()).resolves.toEqual({
			supported: false,
			persistenceSupported: false,
			persisted: null,
			usageBytes: null,
			quotaBytes: null,
			usagePercentage: null,
		});
	});

	it("evita dividir entre cuota cero", async () => {
		installStorage({ estimate: vi.fn().mockResolvedValue({ usage: 10, quota: 0 }) });
		expect((await getStorageStatus()).usagePercentage).toBeNull();
	});

	it("degrada de forma segura ante errores inesperados", async () => {
		installStorage({
			persist: vi.fn().mockRejectedValue(new Error("denied")),
			persisted: vi.fn().mockRejectedValue(new Error("failed")),
			estimate: vi.fn().mockRejectedValue(new Error("failed")),
		});

		await expect(requestPersistentStorage()).resolves.toMatchObject({
			supported: true,
			persisted: null,
			usageBytes: null,
			quotaBytes: null,
		});
	});
});
