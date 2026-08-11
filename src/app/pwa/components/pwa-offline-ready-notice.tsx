import { Button } from "@/shared/components/ui/button";
import { usePwa } from "../pwa-context";

export function PwaOfflineReadyNotice({ visible }: { visible: boolean }) {
	const { dismissOfflineReady } = usePwa();
	if (!visible) return null;
	return (
		<aside
			className="pointer-events-none fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[70] flex max-w-sm items-center gap-3 rounded-xl border bg-popover p-4 text-sm shadow-lg md:bottom-4"
			aria-live="polite"
		>
			<p>Bodegix está lista para funcionar sin conexión.</p>
			<Button
				type="button"
				size="sm"
				variant="ghost"
				className="pointer-events-auto"
				onClick={dismissOfflineReady}
			>
				Ocultar aviso
			</Button>
		</aside>
	);
}
