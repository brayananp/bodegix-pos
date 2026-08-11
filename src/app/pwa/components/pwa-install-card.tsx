import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { usePwa } from "../pwa-context";

const STATE_LABELS = {
	unsupported: "No compatible",
	available: "Disponible",
	installed: "Instalada",
	browser_managed: "Gestionada por el navegador",
	unknown: "Estado desconocido",
} as const;

export function PwaInstallCard() {
	const pwa = usePwa();
	return (
		<Card>
			<CardHeader>
				<CardTitle>Instalación</CardTitle>
				<CardDescription>
					Acceso rápido y ventana independiente en dispositivos compatibles.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<p>
					Estado: <span className="font-medium">{STATE_LABELS[pwa.installation.state]}</span>
				</p>
				{pwa.installation.installed ? (
					<p className="text-muted-foreground">Bodegix está instalada en este dispositivo.</p>
				) : pwa.installation.installPromptAvailable ? (
					<Button type="button" onClick={() => void pwa.install()}>
						Instalar Bodegix
					</Button>
				) : (
					<p className="text-muted-foreground">
						Usa el menú de instalación del navegador. En dispositivos Apple, abre Compartir y elige
						“Agregar a pantalla de inicio”. Esta opción varía según navegador y sistema.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
