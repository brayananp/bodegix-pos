import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import type { InventorySearch } from "../inventory-search";

interface CategoryOption {
	id: string;
	name: string;
}
interface InventoryFiltersProps {
	search: InventorySearch;
	categories: CategoryOption[];
	onChange(patch: Partial<InventorySearch>): void;
}

const productStatuses = [
	{ value: "all", label: "Todos" },
	{ value: "active", label: "Activos" },
	{ value: "inactive", label: "Inactivos" },
] as const;
const stockStatuses = [
	{ value: "all", label: "Cualquier stock" },
	{ value: "in_stock", label: "Con stock" },
	{ value: "low_stock", label: "Stock bajo" },
	{ value: "out_of_stock", label: "Agotados" },
] as const;
const sorts = [
	{ value: "name-asc", label: "Nombre A–Z" },
	{ value: "stock-asc", label: "Stock menor primero" },
	{ value: "stock-desc", label: "Stock mayor primero" },
	{ value: "updated-desc", label: "Cambio reciente" },
] as const;
const movementTypes = [
	{ value: "all", label: "Todos los movimientos" },
	{ value: "initial_stock", label: "Stock inicial" },
	{ value: "purchase", label: "Entrada" },
	{ value: "adjustment_in", label: "Ajuste positivo" },
	{ value: "adjustment_out", label: "Ajuste negativo" },
	{ value: "damaged", label: "Dañado" },
	{ value: "expired", label: "Vencido" },
] as const;

export function InventoryFilters({ search, categories, onChange }: InventoryFiltersProps) {
	const categoryItems = [
		{ value: null, label: "Todas las categorías" },
		...categories.map(({ id, name }) => ({ value: id, label: name })),
	];
	return (
		<div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-2 xl:grid-cols-4">
			{search.tab === "stock" ? (
				<>
					<label
						htmlFor="inventory-search"
						className="grid gap-1.5 text-xs font-medium text-muted-foreground"
					>
						Buscar producto
						<Input
							id="inventory-search"
							value={search.q}
							onChange={(event) => onChange({ q: event.target.value, page: 1 })}
							placeholder="Nombre o código"
						/>
					</label>
					<label
						htmlFor="inventory-category"
						className="grid gap-1.5 text-xs font-medium text-muted-foreground"
					>
						Categoría
						<Select
							items={categoryItems}
							value={search.categoryId}
							onValueChange={(value) => onChange({ categoryId: value, page: 1 })}
						>
							<SelectTrigger id="inventory-category" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value={null}>Todas las categorías</SelectItem>
									{categories.map((category) => (
										<SelectItem key={category.id} value={category.id}>
											{category.name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</label>
					<label
						htmlFor="inventory-product-status"
						className="grid gap-1.5 text-xs font-medium text-muted-foreground"
					>
						Producto
						<Select
							items={productStatuses}
							value={search.productStatus}
							onValueChange={(value) => {
								if (value) onChange({ productStatus: value, page: 1 });
							}}
						>
							<SelectTrigger id="inventory-product-status" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{productStatuses.map((item) => (
										<SelectItem key={item.value} value={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</label>
					<label
						htmlFor="inventory-stock-status"
						className="grid gap-1.5 text-xs font-medium text-muted-foreground"
					>
						Stock
						<Select
							items={stockStatuses}
							value={search.stockStatus}
							onValueChange={(value) => {
								if (value) onChange({ stockStatus: value, page: 1 });
							}}
						>
							<SelectTrigger id="inventory-stock-status" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{stockStatuses.map((item) => (
										<SelectItem key={item.value} value={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</label>
					<label
						htmlFor="inventory-sort"
						className="grid gap-1.5 text-xs font-medium text-muted-foreground xl:col-start-4"
					>
						Orden
						<Select
							items={sorts}
							value={search.sort}
							onValueChange={(value) => {
								if (value) onChange({ sort: value, page: 1 });
							}}
						>
							<SelectTrigger id="inventory-sort" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{sorts.map((item) => (
										<SelectItem key={item.value} value={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</label>
				</>
			) : (
				<label
					htmlFor="movement-type"
					className="grid gap-1.5 text-xs font-medium text-muted-foreground"
				>
					Tipo
					<Select
						items={movementTypes}
						value={search.movementType}
						onValueChange={(value) => {
							if (value) onChange({ movementType: value, page: 1 });
						}}
					>
						<SelectTrigger id="movement-type" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{movementTypes.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</label>
			)}
		</div>
	);
}
