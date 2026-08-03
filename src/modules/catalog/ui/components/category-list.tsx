import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { Category } from "../../domain";
import { CatalogEmptyState } from "./catalog-empty-state";

interface CategoryListProps {
	categories: Category[];
	search: string;
	onSearch(search: string): void;
	onCreate(): void;
	onEdit(category: Category): void;
	onToggleActive(category: Category): void;
}

export function CategoryList(props: CategoryListProps) {
	return (
		<div className="grid gap-4">
			<div className="rounded-xl border bg-card p-3">
				<label
					htmlFor="category-search"
					className="grid max-w-md gap-1.5 text-xs font-medium text-muted-foreground"
				>
					Buscar categoría
					<Input
						id="category-search"
						value={props.search}
						onChange={(event) => props.onSearch(event.target.value)}
						placeholder="Nombre de categoría"
					/>
				</label>
			</div>
			{props.categories.length === 0 ? (
				<CatalogEmptyState
					title="No hay categorías para mostrar"
					description="Crea una categoría para organizar mejor tu catálogo."
				/>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{props.categories.map((category) => (
						<li
							key={category.id}
							className="flex min-h-28 flex-col justify-between gap-4 rounded-xl border bg-card p-4 shadow-xs"
						>
							<div className="flex items-start justify-between gap-3">
								<h3 className="font-heading font-semibold">{category.name}</h3>
								<Badge variant={category.isActive ? "secondary" : "outline"}>
									{category.isActive ? "Activa" : "Inactiva"}
								</Badge>
							</div>
							<div className="flex flex-wrap justify-end gap-2">
								<Button variant="ghost" size="sm" onClick={() => props.onEdit(category)}>
									Editar
								</Button>
								<Button
									variant={category.isActive ? "destructive" : "outline"}
									size="sm"
									onClick={() => props.onToggleActive(category)}
								>
									{category.isActive ? "Desactivar" : "Reactivar"}
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
