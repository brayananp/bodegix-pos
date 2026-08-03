import type {
	CashUnitOfWork,
	CloseCashSessionInput,
	OpenCashSessionInput,
	RegisterCashDepositInput,
	RegisterCashWithdrawalInput,
} from "../ports/cash-unit-of-work";

export function openCashSession(unitOfWork: CashUnitOfWork, input: OpenCashSessionInput) {
	return unitOfWork.openSession(input);
}

export function registerCashDeposit(unitOfWork: CashUnitOfWork, input: RegisterCashDepositInput) {
	return unitOfWork.registerDeposit(input);
}

export function registerCashWithdrawal(
	unitOfWork: CashUnitOfWork,
	input: RegisterCashWithdrawalInput,
) {
	return unitOfWork.registerWithdrawal(input);
}

export function closeCashSession(unitOfWork: CashUnitOfWork, input: CloseCashSessionInput) {
	return unitOfWork.closeSession(input);
}
