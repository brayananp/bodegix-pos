import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserBackupFileGateway } from "./browser-backup-file-gateway";
import type { BackupFile } from "../model";

const file: BackupFile = {
	name: "bodegix-backup-test.bodegix",
	blob: new Blob(["content"]),
	manifest: {} as BackupFile["manifest"],
};

afterEach(() => vi.restoreAllMocks());

describe("BrowserBackupFileGateway", () => {
	it("guarda con File System Access y espera el cierre", async () => {
		const write = vi.fn().mockResolvedValue(undefined);
		const close = vi.fn().mockResolvedValue(undefined);
		const browserWindow = {
			showSaveFilePicker: vi.fn().mockResolvedValue({
				createWritable: vi.fn().mockResolvedValue({ write, close }),
			}),
		} as unknown as Window;
		const result = await new BrowserBackupFileGateway(browserWindow).save(file);
		expect(result).toEqual({ status: "saved", strategy: "file_picker" });
		expect(write).toHaveBeenCalledWith(file.blob);
		expect(close).toHaveBeenCalledOnce();
	});

	it("trata la cancelación del picker como resultado normal", async () => {
		const browserWindow = {
			showSaveFilePicker: vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")),
		} as unknown as Window;
		expect(await new BrowserBackupFileGateway(browserWindow).save(file)).toEqual({
			status: "cancelled",
		});
	});

	it("descarga y revoca el Object URL como fallback", async () => {
		const click = vi.fn();
		const remove = vi.fn();
		const anchor = { hidden: false, href: "", download: "", click, remove };
		const createObjectURL = vi.fn().mockReturnValue("blob:test");
		const revokeObjectURL = vi.fn();
		Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
		Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
		const browserWindow = {
			document: {
				createElement: vi.fn().mockReturnValue(anchor),
				body: { append: vi.fn() },
			},
		} as unknown as Window;
		expect(await new BrowserBackupFileGateway(browserWindow).save(file)).toEqual({
			status: "saved",
			strategy: "download",
		});
		expect(createObjectURL).toHaveBeenCalledWith(file.blob);
		expect(click).toHaveBeenCalledOnce();
		expect(remove).toHaveBeenCalledOnce();
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
	});

	it("abre exactamente un archivo desde File System Access", async () => {
		const selected = new File(["backup"], "test.bodegix");
		const browserWindow = {
			showOpenFilePicker: vi
				.fn()
				.mockResolvedValue([{ getFile: vi.fn().mockResolvedValue(selected) }]),
		} as unknown as Window;
		expect(await new BrowserBackupFileGateway(browserWindow).open()).toBe(selected);
	});
});
