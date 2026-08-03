import { parseMoneyToCents } from "@/shared/kernel/money";
import type {
	CloseCashSessionInput,
	OpenCashSessionInput,
	RegisterCashMovementInput,
} from "../../application";
import { CashError } from "../../domain";
import {
	cashMovementFormSchema,
	closeCashFormSchema,
	openCashFormSchema,
} from "./cash-form.schemas";
import type {
	CashMovementFormValues,
	CloseCashFormValues,
	OpenCashFormValues,
} from "./cash-form.types";

function cents(
	value: string,
	code: "INVALID_OPENING_CASH" | "INVALID_CASH_MOVEMENT_AMOUNT" | "INVALID_COUNTED_CASH",
	field: string,
): number {
	try {
		return parseMoneyToCents(value);
	} catch (cause) {
		throw new CashError(code, { field, cause });
	}
}

export function openCashFormValuesToInput(values: OpenCashFormValues): OpenCashSessionInput {
	const result = openCashFormSchema.safeParse(values);
	if (!result.success)
		throw new CashError("INVALID_OPENING_CASH", { field: "openingCash", cause: result.error });
	return {
		openingCashCents: cents(result.data.openingCash, "INVALID_OPENING_CASH", "openingCash"),
	};
}

export function cashMovementFormValuesToInput(
	cashSessionId: string,
	values: CashMovementFormValues,
): RegisterCashMovementInput {
	const result = cashMovementFormSchema.safeParse(values);
	if (!result.success) {
		const reason = result.error.issues.some(({ path }) => path[0] === "reason");
		throw new CashError(reason ? "INVALID_CASH_MOVEMENT_REASON" : "INVALID_CASH_MOVEMENT_AMOUNT", {
			field: reason ? "reason" : "amount",
			cause: result.error,
		});
	}
	return {
		cashSessionId,
		amountCents: cents(result.data.amount, "INVALID_CASH_MOVEMENT_AMOUNT", "amount"),
		reason: result.data.reason.trim(),
	};
}

export function closeCashFormValuesToInput(
	cashSessionId: string,
	values: CloseCashFormValues,
): CloseCashSessionInput {
	const result = closeCashFormSchema.safeParse(values);
	if (!result.success)
		throw new CashError("INVALID_COUNTED_CASH", { field: "countedCash", cause: result.error });
	return {
		cashSessionId,
		countedCashCents: cents(result.data.countedCash, "INVALID_COUNTED_CASH", "countedCash"),
	};
}

export function moneyPreview(value: string): number | null {
	try {
		return parseMoneyToCents(value);
	} catch {
		return null;
	}
}
