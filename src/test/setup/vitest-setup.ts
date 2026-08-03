import "@testing-library/jest-dom";

/**
 * Setup global de Vitest para Bodegix POS.
 *
 * - Registra los matchers de @testing-library/jest-dom
 * - Configura crypto.randomUUID para el entorno jsdom
 */

// jsdom no tiene crypto.randomUUID en versiones antiguas — polyfill
if (typeof globalThis.crypto === "undefined") {
	const { webcrypto } = await import("node:crypto");
	Object.defineProperty(globalThis, "crypto", {
		value: webcrypto,
		writable: false,
	});
} else if (typeof globalThis.crypto.randomUUID === "undefined") {
	const { webcrypto } = await import("node:crypto");
	Object.defineProperty(globalThis.crypto, "randomUUID", {
		value: webcrypto.randomUUID.bind(webcrypto),
		writable: false,
	});
}
