import { z } from "zod";

export const categoryFormSchema = z.object({
	name: z.string().trim().min(2, "Escribe al menos 2 caracteres.").max(60),
});
