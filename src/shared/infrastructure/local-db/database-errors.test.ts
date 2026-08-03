import { describe, expect, it } from "vitest";
import { LocalDatabaseError } from "./database-errors";

describe("LocalDatabaseError", () => {
	it("preserva código y causa con un mensaje seguro", () => {
		const cause = new Error("dato interno sensible");
		const error = new LocalDatabaseError("DATABASE_OPEN_FAILED", cause);

		expect(error.code).toBe("DATABASE_OPEN_FAILED");
		expect(error.cause).toBe(cause);
		expect(error.message).toBe("No se pudo abrir el almacenamiento local.");
		expect(error.message).not.toContain(cause.message);
	});
});
