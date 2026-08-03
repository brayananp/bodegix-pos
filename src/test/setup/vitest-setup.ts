import "@testing-library/jest-dom";

/**
 * Setup global de Vitest para Bodegix POS.
 *
 * - Registra los matchers de @testing-library/jest-dom
 * - Configura crypto.randomUUID para el entorno jsdom
 * - Polyfill window.matchMedia (jsdom no lo implementa)
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

// jsdom no implementa window.matchMedia — polyfill mínimo para componentes
// que usan media queries (SidebarProvider, useIsMobile, etc.)
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string): MediaQueryList => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}),
});
