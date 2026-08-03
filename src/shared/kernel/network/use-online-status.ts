import { useEffect, useState } from "react";

/**
 * Hook para detectar el estado de conexión de red.
 *
 * LIMITACIÓN IMPORTANTE:
 * `navigator.onLine` NO garantiza acceso real a internet.
 * Solo indica si el dispositivo tiene una interfaz de red activa.
 * Un dispositivo puede estar "online" según el navegador pero sin
 * acceso real (ej: conectado a un router sin internet).
 *
 * Para Bodegix POS esto es suficiente como indicador visual de advertencia.
 * No tomes decisiones críticas de negocio basándote solo en este valor.
 *
 * Es seguro para SSR/shell generation: el estado inicial es `true`
 * para no romper el shell de la SPA durante la generación.
 */
export function useOnlineStatus(): boolean {
	const [isOnline, setIsOnline] = useState<boolean>(() => {
		// Durante SSR/generación del shell, navigator no existe
		if (typeof navigator === "undefined") return true;
		return navigator.onLine;
	});

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// Sincronizar con el estado actual al montar
		setIsOnline(navigator.onLine);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return isOnline;
}
