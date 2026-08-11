import { usePwa } from "../pwa-context";

export function OfflineBanner() {
	const { browserOnline } = usePwa();
	if (browserOnline) return null;
	return (
		<output
			className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
			aria-live="polite"
		>
			<span className="font-medium">Sin conexión.</span> Bodegix continúa funcionando con los datos
			guardados en este dispositivo.
		</output>
	);
}
