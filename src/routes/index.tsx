import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/shared/components/ui/card";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from "#/shared/components/ui/field";
import { Input } from "#/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/shared/components/ui/select";
import { Separator } from "#/shared/components/ui/separator";
import { Switch } from "#/shared/components/ui/switch";
import { Textarea } from "#/shared/components/ui/textarea";
import {
	BarcodeScanFreeIcons,
	DeliveryBox02Icon,
	DollarSignIcon,
	PackageSentIcon,
	SaveIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/")({ component: Home });

const productSchema = z.object({
	name: z
		.string()
		.min(3, "El nombre debe tener al menos 3 caracteres")
		.max(120),
	sku: z.string().min(2, "El SKU es requerido").max(40),
	price: z.coerce.number().positive("El precio debe ser mayor a 0"),
	stock: z.coerce.number().int("El stock debe ser un entero").min(0),
	category: z.string().min(1, "Selecciona una categoría"),
	description: z.string().max(500).optional(),
	taxable: z.boolean().default(true),
});

type ProductForm = z.infer<typeof productSchema>;

function Home() {
	const form = useForm({
		defaultValues: {
			name: "",
			sku: "",
			price: 0,
			stock: 0,
			category: "",
			description: "",
			taxable: true,
		} as ProductForm,
		onSubmit: async ({ value }) => {
			const result = productSchema.safeParse(value);
			if (!result.success) {
				toast.error("Revisa los campos del formulario");
				return;
			}
			toast.success(`Producto "${result.data.name}" guardado correctamente`, {
				description: `SKU: ${result.data.sku} • Precio: S/ ${result.data.price.toFixed(2)}`,
			});
		},
		validators: {
			onSubmit: ({ value }) => {
				const result = productSchema.safeParse(value);
				if (!result.success) {
					const fieldErrors: Partial<Record<keyof ProductForm, string[]>> = {};
					for (const issue of result.error.issues) {
						const path = issue.path[0] as keyof ProductForm | undefined;
						if (path) {
							fieldErrors[path] = fieldErrors[path] ?? [];
							fieldErrors[path]!.push(issue.message);
						}
					}
					return { fields: fieldErrors };
				}
				return undefined;
			},
			onChange: ({ value }) => {
				const result = productSchema.safeParse(value);
				if (!result.success) {
					const fieldErrors: Partial<Record<keyof ProductForm, string[]>> = {};
					for (const issue of result.error.issues) {
						const path = issue.path[0] as keyof ProductForm | undefined;
						if (path) {
							fieldErrors[path] = fieldErrors[path] ?? [];
							fieldErrors[path]!.push(issue.message);
						}
					}
					return { fields: fieldErrors };
				}
				return undefined;
			},
		},
	});

	return (
		<div className="flex min-h-screen flex-col gap-6 bg-muted/30 p-4 md:p-8">
			<header className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<HugeiconsIcon
							icon={DeliveryBox02Icon}
							className="size-5"
							strokeWidth={2}
						/>
					</div>
					<div>
						<h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
							Bodegix POS
						</h1>
						<p className="text-sm text-muted-foreground">
							Formulario de ejemplo: TanStack Form + shadcn/ui composition
						</p>
					</div>
					<Badge variant="outline" className="ml-auto">
						MVP Demo
					</Badge>
				</div>
			</header>

			<main className="mx-auto w-full max-w-3xl">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<HugeiconsIcon
									icon={PackageSentIcon}
									className="size-5 text-primary"
									strokeWidth={2}
								/>
								Nuevo producto
							</CardTitle>
							<CardDescription>
								Registra los datos básicos del producto. Los campos marcados son
								obligatorios.
							</CardDescription>
						</CardHeader>
						<Separator />
						<CardContent className="pt-6">
							<FieldGroup>
								<form.Field name="name">
									{(field) => (
										<Field data-invalid={field.state.meta.errors.length > 0}>
											<FieldLabel htmlFor={field.name}>
												Nombre del producto
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="text"
												value={field.state.value}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												onBlur={field.handleBlur}
												placeholder="Ej: Aceite Vegetal 1L"
												aria-invalid={
													field.state.meta.errors.length > 0 || undefined
												}
											/>
											<FieldDescription>
												Nombre comercial visible en la venta.
											</FieldDescription>
											<FieldError
												errors={field.state.meta.errors.map((m) => ({
													message: m,
												}))}
											/>
										</Field>
									)}
								</form.Field>

								<div className="grid grid-cols-1 gap-7 md:grid-cols-2">
									<form.Field name="sku">
										{(field) => (
											<Field data-invalid={field.state.meta.errors.length > 0}>
												<FieldLabel htmlFor={field.name}>
													<span className="inline-flex items-center gap-1.5">
														<HugeiconsIcon
															icon={BarcodeScanFreeIcons}
															className="size-3.5 text-muted-foreground"
															strokeWidth={2}
														/>
														SKU
													</span>
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													type="text"
													value={field.state.value}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													onBlur={field.handleBlur}
													placeholder="ACE-001"
													aria-invalid={
														field.state.meta.errors.length > 0 || undefined
													}
												/>
												<FieldError
													errors={field.state.meta.errors.map((m) => ({
														message: m,
													}))}
												/>
											</Field>
										)}
									</form.Field>

									<form.Field name="category">
										{(field) => (
											<Field data-invalid={field.state.meta.errors.length > 0}>
												<FieldLabel htmlFor={field.name}>Categoría</FieldLabel>
												<Select
													value={field.state.value}
													onValueChange={(value) =>
														field.handleChange(String(value))
													}
												>
													<SelectTrigger
														id={field.name}
														aria-invalid={
															field.state.meta.errors.length > 0 || undefined
														}
													>
														<SelectValue placeholder="Selecciona una categoría" />
													</SelectTrigger>
													<SelectContent>
														<SelectGroup>
															<SelectItem value="abarrotes">
																Abarrotes
															</SelectItem>
															<SelectItem value="limpieza">Limpieza</SelectItem>
															<SelectItem value="bebidas">Bebidas</SelectItem>
															<SelectItem value="snacks">
																Snacks y golosinas
															</SelectItem>
															<SelectItem value="otros">Otro</SelectItem>
														</SelectGroup>
													</SelectContent>
												</Select>
												<FieldError
													errors={field.state.meta.errors.map((m) => ({
														message: m,
													}))}
												/>
											</Field>
										)}
									</form.Field>
								</div>

								<div className="grid grid-cols-1 gap-7 md:grid-cols-2">
									<form.Field name="price">
										{(field) => (
											<Field data-invalid={field.state.meta.errors.length > 0}>
												<FieldLabel htmlFor={field.name}>
													<span className="inline-flex items-center gap-1.5">
														<HugeiconsIcon
															icon={DollarSignIcon}
															className="size-3.5 text-muted-foreground"
															strokeWidth={2}
														/>
														Precio de venta (S/)
													</span>
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													type="number"
													step="0.01"
													min="0"
													value={field.state.value}
													onChange={(event) =>
														field.handleChange(Number(event.target.value))
													}
													onBlur={field.handleBlur}
													placeholder="0.00"
													aria-invalid={
														field.state.meta.errors.length > 0 || undefined
													}
												/>
												<FieldError
													errors={field.state.meta.errors.map((m) => ({
														message: m,
													}))}
												/>
											</Field>
										)}
									</form.Field>

									<form.Field name="stock">
										{(field) => (
											<Field data-invalid={field.state.meta.errors.length > 0}>
												<FieldLabel htmlFor={field.name}>
													Stock inicial
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													type="number"
													step="1"
													min="0"
													value={field.state.value}
													onChange={(event) =>
														field.handleChange(Number(event.target.value))
													}
													onBlur={field.handleBlur}
													placeholder="0"
													aria-invalid={
														field.state.meta.errors.length > 0 || undefined
													}
												/>
												<FieldError
													errors={field.state.meta.errors.map((m) => ({
														message: m,
													}))}
												/>
											</Field>
										)}
									</form.Field>
								</div>

								<form.Field name="taxable">
									{(field) => (
										<Field orientation="horizontal">
											<FieldTitle>
												<FieldLabel htmlFor={field.name}>
													Afecto al IGV
												</FieldLabel>
												<FieldDescription>
													Incluye impuesto en el precio de venta.
												</FieldDescription>
											</FieldTitle>
											<FieldContent>
												<Switch
													id={field.name}
													checked={field.state.value}
													onCheckedChange={(checked) =>
														field.handleChange(checked)
													}
													onBlur={field.handleBlur}
												/>
											</FieldContent>
										</Field>
									)}
								</form.Field>

								<form.Field name="description">
									{(field) => (
										<Field data-invalid={field.state.meta.errors.length > 0}>
											<FieldLabel htmlFor={field.name}>
												Descripción (opcional)
											</FieldLabel>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value ?? ""}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												onBlur={field.handleBlur}
												placeholder="Notas internas, presentación, marca, etc."
												rows={3}
												aria-invalid={
													field.state.meta.errors.length > 0 || undefined
												}
											/>
											<FieldDescription>
												No visible en el comprobante de venta.
											</FieldDescription>
											<FieldError
												errors={field.state.meta.errors.map((m) => ({
													message: m,
												}))}
											/>
										</Field>
									)}
								</form.Field>
							</FieldGroup>
						</CardContent>
						<Separator />
						<CardFooter className="justify-between pt-6">
							<Button variant="ghost" type="reset" onClick={() => form.reset()}>
								Limpiar
							</Button>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button type="submit" disabled={!canSubmit || isSubmitting}>
										<HugeiconsIcon
											icon={SaveIcon}
											data-icon="inline-start"
											strokeWidth={2}
										/>
										{isSubmitting ? "Guardando…" : "Guardar producto"}
									</Button>
								)}
							</form.Subscribe>
						</CardFooter>
					</Card>
				</form>
			</main>
		</div>
	);
}
