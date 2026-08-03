import { cn } from "@/shared/lib/utils";

interface PageHeaderProps {
	title: string;
	description?: string;
	badge?: React.ReactNode;
	actions?: React.ReactNode;
	className?: string;
}

/**
 * Encabezado estándar de página.
 * Usado en el contenido principal de cada ruta (visible en desktop y móvil).
 */
export function PageHeader({ title, description, badge, actions, className }: PageHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-1 px-4 pt-5 pb-4 md:px-6 md:pt-6",
				"border-b border-border bg-background",
				className,
			)}
		>
			<div className="flex items-start gap-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<h1 className="text-lg font-semibold tracking-tight md:text-xl leading-tight">
							{title}
						</h1>
						{badge}
					</div>
					{description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
				</div>
				{actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
			</div>
		</div>
	);
}
