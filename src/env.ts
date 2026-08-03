import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Variables de entorno tipadas para Bodegix POS.
 *
 * En la Fase 0 no existen variables obligatorias.
 * Las variables VITE_ son accesibles en el cliente (SPA).
 * No hay servidor ni backend en el MVP.
 */
export const env = createEnv({
	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).default("Bodegix POS"),
	},

	runtimeEnv: import.meta.env,

	emptyStringAsUndefined: true,
});
