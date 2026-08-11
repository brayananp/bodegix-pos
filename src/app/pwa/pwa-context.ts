import { createContext, useContext } from "react";
import type { PwaContextValue } from "./pwa.types";

export const PwaContext = createContext<PwaContextValue | null>(null);

export function usePwa(): PwaContextValue {
	const value = useContext(PwaContext);
	if (!value) throw new Error("usePwa debe utilizarse dentro de PwaProvider");
	return value;
}
