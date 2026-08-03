import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import type { Category } from "../../domain";
import type { ProductsSearch } from "../catalog-search";

interface ProductFiltersProps {
	search: ProductsSearch;
	categories: Category[];
	onChange(patch: Partial<ProductsSearch>): void;
}

const statusItems = [
	{ value: "all", label: "Todos" },
	{ value: "active", label: "Activos" },
	{ value: "inactive", label: "Inactivos" },
] as const;
const sortItems = [
	{ value: "name-asc", label: "Nombre A–Z" },
	{ value: "name-desc", label: "Nombre Z–A" },
	{ value: "updated-desc", label: "Actualizados recientemente" },
] as const;

export function ProductFilters({ search, categories, onChange }: ProductFiltersProps) {
	const categoryItems = [
		{ value: null, label: "Todas las categorías" },
		...categories.map(({ id, name }) => ({ value: id, label: name })),
	];
	return (
		<div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_13rem_10rem_14rem]">
			<label
				htmlFor="product-search"
				className="grid gap-1.5 text-xs font-medium text-muted-foreground"
			>
				Buscar producto
				<Input
					id="product-search"
					value={search.q}
					onChange={(event) => onChange({ q: event.target.value, page: 1 })}
					placeholder="Nombre o código"
					aria-label="Buscar productos por nombre o código"
				/>
			</label>
			<label
				htmlFor="product-category-filter"
				className="grid gap-1.5 text-xs font-medium text-muted-foreground"
			>
				Categoría
				<Select
					items={categoryItems}
					value={search.categoryId}
					onValueChange={(value) => onChange({ categoryId: value, page: 1 })}
				>
					<SelectTrigger
						id="product-category-filter"
						className="w-full"
						aria-label="Filtrar por categoría"
					>
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
				htmlFor="product-status-filter"
				className="grid gap-1.5 text-xs font-medium text-muted-foreground"
			>
				Estado
				<Select
					items={statusItems}
					value={search.status}
					onValueChange={(value) => {
						if (value) onChange({ status: value, page: 1 });
					}}
				>
					<SelectTrigger
						id="product-status-filter"
						className="w-full"
						aria-label="Filtrar por estado"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{statusItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</label>
			<label
				htmlFor="product-sort"
				className="grid gap-1.5 text-xs font-medium text-muted-foreground"
			>
				Orden
				<Select
					items={sortItems}
					value={search.sort}
					onValueChange={(value) => {
						if (value) onChange({ sort: value, page: 1 });
					}}
				>
					<SelectTrigger id="product-sort" className="w-full" aria-label="Ordenar productos">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{sortItems.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</label>
		</div>
	);
}
