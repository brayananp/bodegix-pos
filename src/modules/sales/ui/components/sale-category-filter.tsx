import { Button } from "@/shared/components/ui/button";

interface Category {
	id: string;
	name: string;
}

interface SaleCategoryFilterProps {
	categories: Category[];
	selectedId: string | null;
	onSelect(id: string | null): void;
}

export function SaleCategoryFilter({ categories, selectedId, onSelect }: SaleCategoryFilterProps) {
	if (categories.length === 0) return null;

	return (
		<fieldset className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none border-0 p-0 m-0">
			<legend className="sr-only">Filtrar por categoría</legend>
			<Button
				type="button"
				size="sm"
				variant={selectedId === null ? "default" : "outline"}
				onClick={() => onSelect(null)}
				aria-pressed={selectedId === null}
				className="shrink-0"
			>
				Todos
			</Button>
			{categories.map((cat) => (
				<Button
					key={cat.id}
					type="button"
					size="sm"
					variant={selectedId === cat.id ? "default" : "outline"}
					onClick={() => onSelect(cat.id)}
					aria-pressed={selectedId === cat.id}
					className="shrink-0"
				>
					{cat.name}
				</Button>
			))}
		</fieldset>
	);
}
