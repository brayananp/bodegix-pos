import {
	createCategory,
	createProduct,
	DexieCatalogStore,
	setProductActiveState,
} from "@/modules/catalog";
import {
	closeCashSession,
	DexieCashQueries,
	DexieCashUnitOfWork,
	openCashSession,
	registerCashDeposit,
	registerCashWithdrawal,
} from "@/modules/cash";
import {
	DexieInventoryUnitOfWork,
	initializeProductStock,
	registerStockEntry,
	registerStockLoss,
} from "@/modules/inventory";
import {
	DexieCompleteSaleUnitOfWork,
	DexieSaleDraftStore,
	DexieVoidSaleUnitOfWork,
	type SalePaymentIntent,
	voidSale,
} from "@/modules/sales";
import {
	type BodegixDatabase,
	getLocalDatabase,
	initializeLocalDatabase,
	openDatabase,
	runDatabaseDiagnostics,
} from "@/shared/infrastructure/local-db";

interface DemoProductInput {
	readonly key: string;
	readonly name: string;
	readonly barcode: string | null;
	readonly category: string;
	readonly price: number;
	readonly cost: number;
	readonly stock: number;
	readonly minimum: number;
	readonly inactive?: boolean;
}

export interface DemoSeedSummary {
	readonly businessName: string;
	readonly categories: number;
	readonly products: number;
	readonly inventoryMovements: number;
	readonly cashSessions: number;
	readonly cashMovements: number;
	readonly sales: number;
	readonly voidedSales: number;
	readonly saleItems: number;
	readonly salePayments: number;
	readonly draftItems: number;
	readonly openCashSession: boolean;
	readonly diagnostics: "pass" | "warning" | "fail";
}

const PRODUCTS: readonly DemoProductInput[] = [
	{
		key: "coca",
		name: "Coca-Cola 500 ml",
		barcode: "7750182001108",
		category: "Bebidas",
		price: 350,
		cost: 220,
		stock: 24,
		minimum: 6,
	},
	{
		key: "inca",
		name: "Inca Kola 500 ml",
		barcode: "7750182000880",
		category: "Bebidas",
		price: 350,
		cost: 215,
		stock: 18,
		minimum: 6,
	},
	{
		key: "agua",
		name: "Agua San Luis 625 ml",
		barcode: "7750182222336",
		category: "Bebidas",
		price: 200,
		cost: 105,
		stock: 30,
		minimum: 8,
	},
	{
		key: "pilsen",
		name: "Cerveza Pilsen 630 ml",
		barcode: "7750131000060",
		category: "Bebidas",
		price: 700,
		cost: 510,
		stock: 12,
		minimum: 4,
	},
	{
		key: "leche",
		name: "Leche Gloria entera 1 L",
		barcode: "7751271021014",
		category: "Lácteos",
		price: 480,
		cost: 365,
		stock: 10,
		minimum: 4,
	},
	{
		key: "yogurt",
		name: "Yogurt fresa 1 L",
		barcode: "7751271009456",
		category: "Lácteos",
		price: 750,
		cost: 540,
		stock: 5,
		minimum: 5,
	},
	{
		key: "pan",
		name: "Pan francés",
		barcode: null,
		category: "Panadería",
		price: 30,
		cost: 18,
		stock: 40,
		minimum: 12,
	},
	{
		key: "huevos",
		name: "Huevos pack x6",
		barcode: "7759999000102",
		category: "Abarrotes",
		price: 600,
		cost: 450,
		stock: 6,
		minimum: 4,
	},
	{
		key: "arroz",
		name: "Arroz Costeño 1 kg",
		barcode: "7750243050168",
		category: "Abarrotes",
		price: 520,
		cost: 405,
		stock: 20,
		minimum: 5,
	},
	{
		key: "azucar",
		name: "Azúcar rubia 1 kg",
		barcode: "7750011000012",
		category: "Abarrotes",
		price: 450,
		cost: 335,
		stock: 15,
		minimum: 5,
	},
	{
		key: "aceite",
		name: "Aceite Primor 1 L",
		barcode: "7750243001238",
		category: "Abarrotes",
		price: 1050,
		cost: 850,
		stock: 8,
		minimum: 3,
	},
	{
		key: "atun",
		name: "Atún Florida 170 g",
		barcode: "7750151001153",
		category: "Abarrotes",
		price: 650,
		cost: 490,
		stock: 0,
		minimum: 4,
	},
	{
		key: "oreo",
		name: "Galletas Oreo 36 g",
		barcode: "7622210871346",
		category: "Snacks",
		price: 180,
		cost: 110,
		stock: 6,
		minimum: 4,
	},
	{
		key: "sublime",
		name: "Chocolate Sublime 30 g",
		barcode: "7750150000140",
		category: "Snacks",
		price: 200,
		cost: 125,
		stock: 3,
		minimum: 4,
	},
	{
		key: "fideos",
		name: "Fideos Don Vittorio 500 g",
		barcode: "7750243030207",
		category: "Abarrotes",
		price: 420,
		cost: 310,
		stock: 12,
		minimum: 4,
	},
	{
		key: "detergente",
		name: "Detergente Ace 800 g",
		barcode: "7500435140215",
		category: "Limpieza",
		price: 980,
		cost: 730,
		stock: 10,
		minimum: 3,
	},
	{
		key: "papel",
		name: "Papel higiénico Elite x4",
		barcode: "7751493000484",
		category: "Limpieza",
		price: 850,
		cost: 640,
		stock: 7,
		minimum: 3,
	},
	{
		key: "jabon",
		name: "Jabón Bolívar 210 g",
		barcode: "7750243020352",
		category: "Limpieza",
		price: 350,
		cost: 250,
		stock: 3,
		minimum: 2,
		inactive: true,
	},
];

function createSeedDependencies() {
	let idSequence = 0;
	let timestamp = Date.now() - 7 * 24 * 60 * 60 * 1_000;
	return {
		createId: () => `demo-seed-${String(++idSequence).padStart(5, "0")}`,
		now: () => (timestamp += 60_000),
		setTime: (value: number) => {
			timestamp = value;
		},
	};
}

async function assertBusinessTablesEmpty(database: BodegixDatabase): Promise<void> {
	const tables = database.tables.filter(({ name }) => name !== "appSettings");
	const counts = await Promise.all(tables.map((table) => table.count()));
	const occupied = tables
		.map((table, index) => ({ table: table.name, count: counts[index] ?? 0 }))
		.filter(({ count }) => count > 0);
	if (occupied.length > 0) {
		throw new Error(
			`El seed solo se carga sobre una base vacía. Tablas ocupadas: ${occupied.map(({ table, count }) => `${table}=${count}`).join(", ")}.`,
		);
	}
}

export async function seedDemoDatabase(
	database: BodegixDatabase = getLocalDatabase(),
): Promise<DemoSeedSummary> {
	await openDatabase(database);
	await initializeLocalDatabase(database);
	await assertBusinessTablesEmpty(database);

	const deps = createSeedDependencies();
	const catalog = new DexieCatalogStore(database);
	const inventory = new DexieInventoryUnitOfWork(database, deps);
	const cash = new DexieCashUnitOfWork(database, deps);
	const cashQueries = new DexieCashQueries(database);
	const drafts = new DexieSaleDraftStore(database, deps.now);
	const completeSale = new DexieCompleteSaleUnitOfWork(database, deps);
	const voidSaleUnitOfWork = new DexieVoidSaleUnitOfWork(database, deps);

	const categoryIds = new Map<string, string>();
	for (const name of ["Bebidas", "Lácteos", "Panadería", "Abarrotes", "Snacks", "Limpieza"]) {
		const category = await createCategory(catalog, { name }, deps);
		categoryIds.set(name, category.id);
	}

	const productIds = new Map<string, string>();
	for (const input of PRODUCTS) {
		const product = await createProduct(
			catalog,
			{
				name: input.name,
				barcode: input.barcode,
				categoryId: categoryIds.get(input.category) ?? null,
				salePriceCents: input.price,
				costPriceCents: input.cost,
				minimumStockQuantity: input.minimum,
			},
			deps,
		);
		productIds.set(input.key, product.id);
		if (input.stock > 0) {
			await initializeProductStock(inventory, {
				productId: product.id,
				quantity: input.stock,
				note: "Stock inicial del escenario demo",
			});
		}
		if (input.inactive) await setProductActiveState(catalog, product.id, false, deps);
	}

	const productId = (key: string) => {
		const id = productIds.get(key);
		if (!id) throw new Error(`Producto demo desconocido: ${key}`);
		return id;
	};

	await registerStockEntry(inventory, {
		productId: productId("coca"),
		quantity: 10,
		reference: "FAC-DEMO-001",
		note: "Reposición semanal",
	});
	await registerStockLoss(inventory, {
		productId: productId("yogurt"),
		quantity: 1,
		lossType: "expired",
		reason: "Unidad vencida durante control demo",
	});
	await registerStockLoss(inventory, {
		productId: productId("agua"),
		quantity: 2,
		lossType: "damaged",
		reason: null,
	});

	async function complete(
		items: ReadonlyArray<{ key: string; quantity: number }>,
		payments: (totalCents: number) => SalePaymentIntent[],
	) {
		await drafts.clear();
		let totalCents = 0;
		for (const item of items) {
			const product = await database.products.get(productId(item.key));
			if (!product) throw new Error(`No existe el producto demo ${item.key}.`);
			await drafts.addProduct(product.id, product.salePriceCents, product.stockQuantity);
			if (item.quantity !== 1) {
				await drafts.setQuantity(product.id, item.quantity, product.stockQuantity);
			}
			totalCents += product.salePriceCents * item.quantity;
		}
		return completeSale.execute({ paymentIntents: payments(totalCents) });
	}

	const cashPayment = (total: number): SalePaymentIntent[] => [
		{
			method: "cash",
			amountCents: total,
			cashReceivedCents: total + 500,
			operationReference: null,
			manuallyVerified: false,
		},
	];
	const externalPayment =
		(method: "yape" | "plin" | "card" | "bank_transfer", reference: string) =>
		(total: number): SalePaymentIntent[] => [
			{
				method,
				amountCents: total,
				cashReceivedCents: null,
				operationReference: reference,
				manuallyVerified: true,
			},
		];

	deps.setTime(Date.now() - 30 * 60 * 60 * 1_000);
	const closedSession = await openCashSession(cash, { openingCashCents: 20_000 });
	await registerCashDeposit(cash, {
		cashSessionId: closedSession.id,
		amountCents: 5_000,
		reason: "Sencillo adicional demo",
	});
	await registerCashWithdrawal(cash, {
		cashSessionId: closedSession.id,
		amountCents: 3_000,
		reason: "Pago a proveedor demo",
	});
	await complete(
		[
			{ key: "coca", quantity: 2 },
			{ key: "pan", quantity: 4 },
		],
		cashPayment,
	);
	await complete([{ key: "yogurt", quantity: 1 }], externalPayment("yape", "YAPE-DEMO-001"));
	await complete(
		[
			{ key: "arroz", quantity: 1 },
			{ key: "aceite", quantity: 1 },
		],
		(total) => [
			{
				method: "cash",
				amountCents: 500,
				cashReceivedCents: 500,
				operationReference: null,
				manuallyVerified: false,
			},
			{
				method: "card",
				amountCents: total - 500,
				cashReceivedCents: null,
				operationReference: "POS-DEMO-001",
				manuallyVerified: true,
			},
		],
	);
	const closedSummary = await cashQueries.getSessionSummary(closedSession.id);
	if (!closedSummary) throw new Error("No fue posible calcular el cierre demo.");
	await closeCashSession(cash, {
		cashSessionId: closedSession.id,
		countedCashCents: closedSummary.expectedCashCents - 100,
	});

	deps.setTime(Date.now() - 2 * 60 * 60 * 1_000);
	const openSession = await openCashSession(cash, { openingCashCents: 15_000 });
	await registerCashDeposit(cash, {
		cashSessionId: openSession.id,
		amountCents: 2_000,
		reason: "Cambio para turno actual",
	});
	await registerCashWithdrawal(cash, {
		cashSessionId: openSession.id,
		amountCents: 1_000,
		reason: "Compra urgente de bolsas",
	});
	await complete(
		[
			{ key: "inca", quantity: 2 },
			{ key: "oreo", quantity: 1 },
		],
		cashPayment,
	);
	await complete(
		[
			{ key: "leche", quantity: 1 },
			{ key: "pan", quantity: 6 },
		],
		externalPayment("plin", "PLIN-DEMO-002"),
	);
	await complete(
		[
			{ key: "pilsen", quantity: 2 },
			{ key: "papel", quantity: 1 },
		],
		(total) => [
			{
				method: "cash",
				amountCents: 1_000,
				cashReceivedCents: 1_000,
				operationReference: null,
				manuallyVerified: false,
			},
			{
				method: "card",
				amountCents: total - 1_000,
				cashReceivedCents: null,
				operationReference: "POS-DEMO-002",
				manuallyVerified: true,
			},
		],
	);
	const saleToVoid = await complete(
		[{ key: "fideos", quantity: 2 }],
		externalPayment("bank_transfer", "TRX-DEMO-003"),
	);
	const paymentsToVoid = await database.salePayments
		.where("saleId")
		.equals(saleToVoid.saleId)
		.toArray();
	await voidSale(voidSaleUnitOfWork, {
		saleId: saleToVoid.saleId,
		reason: "Cliente solicitó anulación del escenario demo",
		paymentReversals: paymentsToVoid.map((payment) => ({
			paymentId: payment.id,
			confirmed: true,
			reversalReference: payment.method === "cash" ? null : "REV-DEMO-003",
		})),
	});
	await complete(
		[
			{ key: "agua", quantity: 2 },
			{ key: "sublime", quantity: 1 },
		],
		cashPayment,
	);

	await drafts.addProduct(
		productId("pan"),
		30,
		(await database.products.get(productId("pan")))?.stockQuantity ?? 0,
	);
	await drafts.setQuantity(
		productId("pan"),
		2,
		(await database.products.get(productId("pan")))?.stockQuantity ?? 0,
	);
	await drafts.addProduct(
		productId("leche"),
		480,
		(await database.products.get(productId("leche")))?.stockQuantity ?? 0,
	);

	await database.appSettings.update("main", {
		businessName: "Bodega Demo Bodegix",
		setupCompleted: true,
		updatedAt: Date.now(),
	});

	const diagnostics = await runDatabaseDiagnostics(database, "deep");
	if (diagnostics.status === "fail") {
		throw new Error("El seed demo no superó el diagnóstico profundo.");
	}

	const [
		categories,
		products,
		inventoryMovements,
		cashSessions,
		cashMovements,
		sales,
		voidedSales,
		saleItems,
		salePayments,
		draft,
	] = await Promise.all([
		database.categories.count(),
		database.products.count(),
		database.inventoryMovements.count(),
		database.cashSessions.count(),
		database.cashMovements.count(),
		database.sales.count(),
		database.sales.where("status").equals("voided").count(),
		database.saleItems.count(),
		database.salePayments.count(),
		database.saleDrafts.get("main"),
	]);

	return {
		businessName: "Bodega Demo Bodegix",
		categories,
		products,
		inventoryMovements,
		cashSessions,
		cashMovements,
		sales,
		voidedSales,
		saleItems,
		salePayments,
		draftItems: draft?.items.length ?? 0,
		openCashSession: (await database.cashSessions.where("status").equals("open").count()) === 1,
		diagnostics: diagnostics.status,
	};
}
