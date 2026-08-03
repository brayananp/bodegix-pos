import type { CashMovement, CashSession, CashSessionSummary } from "../../domain";

export interface OpenCashSessionInput {
	openingCashCents: number;
}

export interface RegisterCashMovementInput {
	cashSessionId: string;
	amountCents: number;
	reason: string;
}

export type RegisterCashDepositInput = RegisterCashMovementInput;
export type RegisterCashWithdrawalInput = RegisterCashMovementInput;

export interface CloseCashSessionInput {
	cashSessionId: string;
	countedCashCents: number;
}

export interface CashUnitOfWork {
	openSession(input: OpenCashSessionInput): Promise<CashSession>;
	registerDeposit(input: RegisterCashDepositInput): Promise<CashMovement>;
	registerWithdrawal(input: RegisterCashWithdrawalInput): Promise<CashMovement>;
	closeSession(input: CloseCashSessionInput): Promise<CashSessionSummary>;
}
