import { formOptions } from "@tanstack/react-form";
import { categoryFormSchema } from "./category-form.schema";
import type { CategoryFormValues } from "./category-form.types";

export const categoryFormDefaultValues: CategoryFormValues = { name: "" };

export const categoryFormOptions = formOptions({
	defaultValues: categoryFormDefaultValues,
	validators: { onSubmit: categoryFormSchema },
});
