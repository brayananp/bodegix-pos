import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useAppForm } from "./app-form";

type FieldKind = "text" | "textarea" | "money" | "integer" | "barcode";

function FieldHarness({ kind, onValue }: { kind: FieldKind; onValue?(value: string): void }) {
	const form = useAppForm({ defaultValues: { value: "" } });
	return (
		<form.AppField
			name="value"
			validators={{ onBlur: z.string().min(2, "Escribe al menos dos caracteres.") }}
		>
			{(field) => {
				const common = { label: "Valor", onInput: () => onValue?.(field.state.value) };
				if (kind === "money") return <field.MoneyField {...common} />;
				if (kind === "integer") return <field.IntegerField {...common} />;
				if (kind === "barcode") return <field.BarcodeField {...common} />;
				if (kind === "textarea") return <field.TextareaField {...common} />;
				return <field.TextField {...common} />;
			}}
		</form.AppField>
	);
}

function SubmitHarness({ submit }: { submit(): Promise<void> }) {
	const form = useAppForm({
		defaultValues: { value: "válido" },
		onSubmit: submit,
	});
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.AppForm>
				<form.SubmitButton label="Guardar" submittingLabel="Enviando…" />
			</form.AppForm>
		</form>
	);
}

describe("composición compartida de formularios", () => {
	it("TextField conecta cambio, blur y errores accesibles", async () => {
		const user = userEvent.setup();
		render(<FieldHarness kind="text" />);
		const input = screen.getByLabelText("Valor");
		await user.type(input, "a");
		await user.tab();
		expect(input).toHaveValue("a");
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(screen.getByRole("alert")).toHaveTextContent("Escribe al menos dos caracteres");
	});

	it("MoneyField conserva estados parciales como texto", async () => {
		const user = userEvent.setup();
		render(<FieldHarness kind="money" />);
		const input = screen.getByLabelText("Valor");
		await user.type(input, "12.");
		expect(input).toHaveValue("12.");
		expect(screen.getByText("S/")).toBeVisible();
	});

	it("TextareaField conecta valor, descripción y validación accesible", async () => {
		const user = userEvent.setup();
		render(<FieldHarness kind="textarea" />);
		const input = screen.getByLabelText("Valor");
		await user.type(input, "a");
		await user.tab();
		expect(input).toHaveValue("a");
		expect(screen.getByRole("alert")).toHaveTextContent("Escribe al menos dos caracteres");
	});

	it("BarcodeField conserva ceros iniciales", async () => {
		const user = userEvent.setup();
		render(<FieldHarness kind="barcode" />);
		const input = screen.getByLabelText("Valor");
		await user.type(input, "00123A");
		expect(input).toHaveValue("00123A");
	});

	it("IntegerField rechaza valores decimales y permite vacío", () => {
		render(<FieldHarness kind="integer" />);
		const input = screen.getByLabelText("Valor");
		fireEvent.change(input, { target: { value: "12.5" } });
		expect(input).toHaveValue("");
		fireEvent.change(input, { target: { value: "12" } });
		expect(input).toHaveValue("12");
		fireEvent.change(input, { target: { value: "" } });
		expect(input).toHaveValue("");
	});

	it("SubmitButton evita doble envío y refleja isSubmitting", async () => {
		let resolveSubmit = () => {};
		const pending = new Promise<void>((resolve) => {
			resolveSubmit = resolve;
		});
		const user = userEvent.setup();
		render(<SubmitHarness submit={() => pending} />);
		const button = screen.getByRole("button", { name: "Guardar" });
		await user.click(button);
		expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();
		await act(async () => resolveSubmit());
		await waitFor(() => expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled());
	});
});
