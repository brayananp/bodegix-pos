import { z } from "zod";

export const productsSearchSchema = z.object({
	tab: z.enum(["products", "categories"]).catch("products"),
	q: z.string().catch(""),
	status: z.enum(["all", "active", "inactive"]).catch("active"),
	categoryId: z.string().nullable().catch(null),
	page: z.number().int().positive().catch(1),
	pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]).catch(25),
	sort: z.enum(["name-asc", "name-desc", "updated-desc"]).catch("name-asc"),
	panel: z
		.enum(["product-create", "product-detail", "product-edit", "category-create", "category-edit"])
		.nullable()
		.catch(null),
	productId: z.string().nullable().catch(null),
	categoryEditId: z.string().nullable().catch(null),
});

export type ProductsSearch = z.infer<typeof productsSearchSchema>;
export type ProductPanelMode = "create" | "detail" | "edit";
