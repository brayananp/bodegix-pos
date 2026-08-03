import { Button } from "@/shared/components/ui/button";

export function CatalogEmptyState({
	title,
	description,
	actionLabel,
	onAction,
}: {
	title: string;
	description: string;
	actionLabel?: string;
	onAction?(): void;
}) {
	return (
		<div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-8 text-center">
			<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 font-heading text-lg font-semibold text-primary">
				B
			</div>
			<div className="max-w-sm">
				<h2 className="font-heading text-base font-semibold">{title}</h2>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
			{actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
		</div>
	);
}
