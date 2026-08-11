import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

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
		<ScrollArea className="h-11 w-full min-w-0" scrollbars="horizontal">
			<fieldset className="m-0 flex w-max min-w-full gap-1.5 border-0 p-0 pe-1">
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
		</ScrollArea>
	);
}
