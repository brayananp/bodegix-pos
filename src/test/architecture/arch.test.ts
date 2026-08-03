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

describe("Arquitectura — catálogo y formularios compartidos", () => {
	const productionFiles = (directory: string) =>
		collectFiles(directory).filter(
			(file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"),
		);

	it("el dominio del catálogo no importa React, TanStack Form ni Dexie", () => {
		const violations = productionFiles(join(SRC, "modules/catalog/domain")).flatMap((file) =>
			getImports(file)
				.filter(
					(moduleName) =>
						moduleName === "react" ||
						moduleName.includes("@tanstack/react-form") ||
						moduleName === "dexie" ||
						moduleName === "dexie-react-hooks",
				)
				.map((moduleName) => `${relative(SRC, file)}: importa "${moduleName}"`),
		);
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("la aplicación del catálogo no importa UI, React ni Dexie", () => {
		const violations = productionFiles(join(SRC, "modules/catalog/application")).flatMap((file) =>
			getImports(file)
				.filter(
					(moduleName) =>
						moduleName.includes("/ui") ||
						moduleName === "react" ||
						moduleName === "dexie" ||
						moduleName === "dexie-react-hooks",
				)
				.map((moduleName) => `${relative(SRC, file)}: importa "${moduleName}"`),
		);
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("los formularios compartidos no dependen de catálogo ni Dexie", () => {
		const violations = productionFiles(join(SRC, "shared/ui/forms")).flatMap((file) =>
			getImports(file)
				.filter(
					(moduleName) =>
						moduleName.includes("modules/catalog") ||
						moduleName === "dexie" ||
						moduleName === "dexie-react-hooks",
				)
				.map((moduleName) => `${relative(SRC, file)}: importa "${moduleName}"`),
		);
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("las rutas no importan Dexie ni implementan formularios", () => {
		const violations: string[] = [];
		for (const file of productionFiles(join(SRC, "routes"))) {
			const content = readFileSync(file, "utf-8");
			if (/dexie|useLiveQuery|useAppForm|<form[.>]/i.test(content)) {
				violations.push(relative(SRC, file));
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("no se incorpora TanStack Query ni conversión monetaria con parseFloat", () => {
		const violations: string[] = [];
		for (const file of productionFiles(SRC)) {
			const content = readFileSync(file, "utf-8");
			if (content.includes("@tanstack/react-query")) violations.push(relative(SRC, file));
			if (file.includes(join("shared", "kernel", "money")) && content.includes("parseFloat")) {
				violations.push(`${relative(SRC, file)} usa parseFloat`);
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});
});

describe("Arquitectura — inventario", () => {
	const productionFiles = (directory: string) =>
		collectFiles(directory).filter(
			(file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"),
		);

	it("el dominio de inventario permanece puro", () => {
		const violations = productionFiles(join(SRC, "modules/inventory/domain")).flatMap((file) =>
			getImports(file)
				.filter(
					(moduleName) =>
						moduleName === "react" ||
						moduleName.startsWith("@tanstack/") ||
						moduleName === "dexie" ||
						moduleName === "dexie-react-hooks",
				)
				.map((moduleName) => `${relative(SRC, file)}: importa "${moduleName}"`),
		);
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("la aplicación de inventario no depende de UI, React ni Dexie", () => {
		const violations = productionFiles(join(SRC, "modules/inventory/application")).flatMap((file) =>
			getImports(file)
				.filter(
					(moduleName) =>
						moduleName.includes("/ui") ||
						moduleName === "react" ||
						moduleName === "dexie" ||
						moduleName === "dexie-react-hooks",
				)
				.map((moduleName) => `${relative(SRC, file)}: importa "${moduleName}"`),
		);
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("componentes y formularios no acceden a Dexie ni a tablas", () => {
		const uiFiles = [
			...productionFiles(join(SRC, "modules/inventory/ui/components")),
			...productionFiles(join(SRC, "modules/inventory/ui/forms")),
			...productionFiles(join(SRC, "modules/inventory/ui/overlays")),
		];
		const violations = uiFiles.flatMap((file) =>
			getImports(file)
				.filter(
					(moduleName) =>
						moduleName === "dexie" ||
						moduleName === "dexie-react-hooks" ||
						moduleName.includes("local-db"),
				)
				.map((moduleName) => `${relative(SRC, file)}: importa "${moduleName}"`),
		);
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("las rutas no modifican stock y los formularios compartidos no dependen de inventario", () => {
		const violations: string[] = [];
		for (const file of productionFiles(join(SRC, "routes"))) {
			const content = readFileSync(file, "utf-8");
			if (/stockQuantity|inventoryMovements|applyStockMutation/.test(content)) {
				violations.push(`${relative(SRC, file)} contiene lógica de inventario`);
			}
		}
		for (const file of productionFiles(join(SRC, "shared/ui/forms"))) {
			for (const moduleName of getImports(file)) {
				if (moduleName.includes("modules/inventory")) {
					violations.push(`${relative(SRC, file)}: importa "${moduleName}"`);
				}
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("inventario no importa privados de catálogo y su infraestructura no importa componentes", () => {
		const violations: string[] = [];
		for (const file of productionFiles(join(SRC, "modules/inventory"))) {
			for (const moduleName of getImports(file)) {
				if (/@\/modules\/catalog\//.test(moduleName)) {
					violations.push(`${relative(SRC, file)}: importa privado de catálogo "${moduleName}"`);
				}
				if (
					file.includes(join("inventory", "infrastructure")) &&
					(moduleName.includes("shared/components") || moduleName.includes("/ui"))
				) {
					violations.push(`${relative(SRC, file)}: importa componente "${moduleName}"`);
				}
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});
});

describe("Arquitectura — caja", () => {
	const productionFiles = (directory: string) =>
		collectFiles(directory).filter(
			(file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"),
		);

	it("el dominio y la aplicación de caja permanecen puros", () => {
		const files = [
			...productionFiles(join(SRC, "modules/cash/domain")),
			...productionFiles(join(SRC, "modules/cash/application")),
		];
		const violations = files.flatMap((file) =>
			getImports(file)
				.filter(
					(moduleName) =>
						moduleName === "react" ||
						moduleName.startsWith("@tanstack/") ||
						moduleName === "dexie" ||
						moduleName === "dexie-react-hooks" ||
						moduleName.includes("/ui"),
				)
				.map((moduleName) => `${relative(SRC, file)}: importa "${moduleName}"`),
		);
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("componentes y formularios de caja no acceden a Dexie", () => {
		const files = [
			...productionFiles(join(SRC, "modules/cash/ui/components")),
			...productionFiles(join(SRC, "modules/cash/ui/forms")),
			...productionFiles(join(SRC, "modules/cash/ui/overlays")),
		];
		const violations = files.flatMap((file) =>
			getImports(file)
				.filter(
					(moduleName) =>
						moduleName === "dexie" ||
						moduleName === "dexie-react-hooks" ||
						moduleName.includes("local-db"),
				)
				.map((moduleName) => `${relative(SRC, file)}: importa "${moduleName}"`),
		);
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("caja solo lee ventas y pagos", () => {
		const violations: string[] = [];
		for (const file of productionFiles(join(SRC, "modules/cash"))) {
			const content = readFileSync(file, "utf-8");
			if (
				/\.(sales|salePayments)\.(?:add|bulkAdd|put|bulkPut|update|delete|bulkDelete|clear)\s*\(/.test(
					content,
				)
			) {
				violations.push(relative(SRC, file));
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});

	it("rutas y formularios compartidos no contienen lógica privada de caja", () => {
		const violations: string[] = [];
		for (const file of productionFiles(join(SRC, "routes"))) {
			const content = readFileSync(file, "utf-8");
			if (/calculateExpectedCash|cashSessions|cashMovements/.test(content)) {
				violations.push(`${relative(SRC, file)} contiene lógica de caja`);
			}
		}
		for (const file of productionFiles(join(SRC, "shared/ui/forms"))) {
			for (const moduleName of getImports(file)) {
				if (moduleName.includes("modules/cash")) {
					violations.push(`${relative(SRC, file)}: importa "${moduleName}"`);
				}
			}
		}
		expect(violations, `Violaciones:\n${violations.join("\n")}`).toHaveLength(0);
	});
});

describe("Arquitectura — dependencias entre módulos", () => {
	it("no existen ciclos entre módulos", () => {
		const modulesDir = join(SRC, "modules");
		const modules = readdirSync(modulesDir).filter((entry) =>
			statSync(join(modulesDir, entry)).isDirectory(),
		);
		const graph = new Map(modules.map((moduleName) => [moduleName, new Set<string>()]));
		for (const moduleName of modules) {
			for (const file of collectFiles(join(modulesDir, moduleName))) {
				for (const imported of getImports(file)) {
					const match = imported.match(/^(?:@|#)\/modules\/([^/]+)(?:\/index)?$/);
					if (match?.[1] && match[1] !== moduleName) graph.get(moduleName)?.add(match[1]);
				}
			}
		}
		const visiting = new Set<string>();
		const visited = new Set<string>();
		const cycles: string[] = [];
		const visit = (moduleName: string, path: string[]) => {
			if (visiting.has(moduleName)) {
				cycles.push([...path, moduleName].join(" -> "));
				return;
			}
			if (visited.has(moduleName)) return;
			visiting.add(moduleName);
			for (const dependency of graph.get(moduleName) ?? [])
				visit(dependency, [...path, moduleName]);
			visiting.delete(moduleName);
			visited.add(moduleName);
		};
		for (const moduleName of modules) visit(moduleName, []);
		expect(cycles, `Ciclos:\n${cycles.join("\n")}`).toHaveLength(0);
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
