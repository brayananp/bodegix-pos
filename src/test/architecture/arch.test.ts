/**
 * Pruebas de arquitectura para Bodegix POS.
 *
 * Verifican que las reglas de dependencia del monolito modular se cumplen.
 * Estas pruebas crecerán con cada fase a medida que se agregue código real.
 *
 * Reglas verificadas:
 * 1. El dominio no importa React, Dexie, TanStack Router, APIs de navegador
 * 2. Los módulos no importan archivos internos de otros módulos
 * 3. Las rutas no importan infraestructura privada de los módulos
 * 4. El shared/kernel no importa React ni Dexie
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../..");
const SRC = join(ROOT, "src");

// ─── Utilidades ─────────────────────────────────────────────────────────────

/** Recorre recursivamente y devuelve todos los archivos .ts/.tsx */
function collectFiles(dir: string, files: string[] = []): string[] {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return files;
	}
	for (const entry of entries) {
		const full = join(dir, entry);
		try {
			const stat = statSync(full);
			if (stat.isDirectory()) {
				if (!entry.startsWith(".") && entry !== "node_modules") {
					collectFiles(full, files);
				}
			} else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".d.ts")) {
				files.push(full);
			}
		} catch {
			// ignorar archivos inaccesibles
		}
	}
	return files;
}

/** Extrae las líneas de import de un archivo */
function getImports(filePath: string): string[] {
	try {
		const content = readFileSync(filePath, "utf-8");
		const importLines: string[] = [];
		const regex = /^\s*(?:import|export)\s+(?:type\s+)?.*?from\s+["']([^"']+)["']/gm;
		let match: RegExpExecArray | null = regex.exec(content);
		while (match !== null) {
			if (match[1]) importLines.push(match[1]);
			match = regex.exec(content);
		}
		return importLines;
	} catch {
		return [];
	}
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Arquitectura — shared/kernel", () => {
	const kernelDir = join(SRC, "shared/kernel");
	const kernelFiles = collectFiles(kernelDir).filter(
		(f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"),
	);

	it("el kernel no importa React (excepto network que usa hooks)", () => {
		const violations: string[] = [];

		for (const file of kernelFiles) {
			// El hook de red está permitido usar React
			if (file.includes("network")) continue;

			const imports = getImports(file);
			for (const imp of imports) {
				if (imp === "react" || imp.startsWith("react/") || imp === "react-dom") {
					violations.push(`${relative(SRC, file)}: importa "${imp}"`);
				}
			}
		}

		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("el kernel no importa Dexie", () => {
		const violations: string[] = [];

		for (const file of kernelFiles) {
			const imports = getImports(file);
			for (const imp of imports) {
				if (imp === "dexie" || imp.startsWith("dexie/") || imp === "dexie-react-hooks") {
					violations.push(`${relative(SRC, file)}: importa "${imp}"`);
				}
			}
		}

		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("el kernel no importa TanStack Router ni Start", () => {
		const violations: string[] = [];

		for (const file of kernelFiles) {
			// El hook de red usa solo React, no Router
			const imports = getImports(file);
			for (const imp of imports) {
				if (imp.includes("@tanstack/react-router") || imp.includes("@tanstack/react-start")) {
					violations.push(`${relative(SRC, file)}: importa "${imp}"`);
				}
			}
		}

		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});
});

describe("Arquitectura — módulos no importan privados de otros módulos", () => {
	const modulesDir = join(SRC, "modules");
	const moduleNames = (() => {
		try {
			return readdirSync(modulesDir).filter((d) => {
				try {
					return statSync(join(modulesDir, d)).isDirectory();
				} catch {
					return false;
				}
			});
		} catch {
			return [];
		}
	})();

	it("cada módulo solo exporta a través de su index.ts (no hay imports cruzados de internos)", () => {
		const violations: string[] = [];

		for (const moduleName of moduleNames) {
			const moduleDir = join(modulesDir, moduleName);
			const files = collectFiles(moduleDir).filter((f) => !f.endsWith("index.ts"));

			for (const file of files) {
				const imports = getImports(file);

				for (const imp of imports) {
					// Verificar si importa un módulo hermano directamente (no via index)
					for (const otherModule of moduleNames) {
						if (otherModule === moduleName) continue;

						// Import como "@/modules/otherModule/internal/file" está prohibido
						// Solo "@/modules/otherModule" o "@/modules/otherModule/index" están permitidos
						const privatePattern = new RegExp(`@/modules/${otherModule}/(?!index$).+`);
						const hashPattern = new RegExp(`#/modules/${otherModule}/(?!index$).+`);

						if (privatePattern.test(imp) || hashPattern.test(imp)) {
							violations.push(
								`${relative(SRC, file)}: importa privado de "${otherModule}": "${imp}"`,
							);
						}
					}
				}
			}
		}

		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});
});

describe("Arquitectura — rutas no importan infraestructura privada de módulos", () => {
	const routesDir = join(SRC, "routes");
	const routeFiles = collectFiles(routesDir);

	it("las rutas no importan subcarpetas internas de módulos (infrastructure/, domain/)", () => {
		const violations: string[] = [];

		for (const file of routeFiles) {
			const imports = getImports(file);

			for (const imp of imports) {
				if (/(#|@)\/modules\/\w+\/(infrastructure|domain|application)/.test(imp)) {
					violations.push(`${relative(SRC, file)}: importa "${imp}"`);
				}
			}
		}

		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("las rutas no importan Dexie ni la base local", () => {
		const violations: string[] = [];
		for (const file of routeFiles) {
			for (const imp of getImports(file)) {
				if (imp === "dexie" || imp === "dexie-react-hooks" || imp.includes("local-db")) {
					violations.push(`${relative(SRC, file)}: importa "${imp}"`);
				}
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});
});

describe("Arquitectura — límites de infraestructura local", () => {
	it("shared/infrastructure no importa UI, app ni módulos", () => {
		const files = collectFiles(join(SRC, "shared/infrastructure"));
		const violations: string[] = [];
		for (const file of files) {
			for (const imp of getImports(file)) {
				if (/^(#|@)\/(app|modules|shared\/components)/.test(imp)) {
					violations.push(`${relative(SRC, file)}: importa "${imp}"`);
				}
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("componentes compartidos no importan Dexie ni tablas locales", () => {
		const files = collectFiles(join(SRC, "shared/components"));
		const violations: string[] = [];
		for (const file of files) {
			for (const imp of getImports(file)) {
				if (imp === "dexie" || imp === "dexie-react-hooks" || imp.includes("local-db")) {
					violations.push(`${relative(SRC, file)}: importa "${imp}"`);
				}
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("domain y application no dependen de React o Dexie", () => {
		const files = collectFiles(join(SRC, "modules")).filter((file) =>
			/[\\/](domain|application)[\\/]/.test(file),
		);
		const violations: string[] = [];
		for (const file of files) {
			for (const imp of getImports(file)) {
				if (imp === "react" || imp.startsWith("react/") || imp.startsWith("dexie")) {
					violations.push(`${relative(SRC, file)}: importa "${imp}"`);
				}
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});
});

describe("Arquitectura — módulos tienen API pública (index.ts)", () => {
	const modulesDir = join(SRC, "modules");

	it("cada módulo expone un index.ts", () => {
		const modules = (() => {
			try {
				return readdirSync(modulesDir).filter((d) => {
					try {
						return statSync(join(modulesDir, d)).isDirectory();
					} catch {
						return false;
					}
				});
			} catch {
				return [];
			}
		})();

		// Solo verificar si existe la carpeta modules
		if (modules.length === 0) return;

		const missing: string[] = [];
		for (const mod of modules) {
			const indexPath = join(modulesDir, mod, "index.ts");
			try {
				readFileSync(indexPath);
			} catch {
				missing.push(mod);
			}
		}

		expect(missing, `Módulos sin index.ts: ${missing.join(", ")}`).toHaveLength(0);
	});
});
