import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";

function errorId(error: Error) {
	let hash = 2166136261;
	const value = `${error.name}:${error.message}:${error.stack ?? ""}`;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return `ERR-${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

export function RootErrorBoundary({ error }: ErrorComponentProps) {
	const router = useRouter();
	const reference = errorId(error);

	return (
		<main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground">
			<section
				className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm"
				aria-labelledby="root-error-title"
			>
				<p className="text-sm font-medium text-destructive">
					Bodegix no pudo mostrar esta pantalla
				</p>
				<h1 id="root-error-title" className="mt-2 font-heading text-2xl font-semibold">
					Tus datos locales no fueron borrados
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
					Reintenta primero. Si el problema continúa, recarga la aplicación o abre Configuración
					para ejecutar el diagnóstico de solo lectura.
				</p>
				<div className="mt-5 flex flex-wrap gap-3">
					<button
						type="button"
						className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
						onClick={() => void router.invalidate()}
					>
						Reintentar
					</button>
					<button
						type="button"
						className="h-10 rounded-md border bg-background px-4 text-sm font-medium"
						onClick={() => window.location.reload()}
					>
						Recargar
					</button>
					<a
						href="/settings"
						className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
					>
						Abrir Configuración
					</a>
				</div>
				<p className="mt-5 font-mono text-xs text-muted-foreground">Referencia: {reference}</p>
			</section>
		</main>
	);
}
