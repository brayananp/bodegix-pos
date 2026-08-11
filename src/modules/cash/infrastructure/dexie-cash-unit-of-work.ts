import type { BodegixDatabase, CashSessionRecord } from "@/shared/infrastructure/local-db";
import { runWithDatabaseWriteAccess } from "@/shared/infrastructure/database-maintenance";
import { nowTimestamp } from "@/shared/kernel/dates";
import { createId } from "@/shared/kernel/ids";
import Dexie from "dexie";
import type {
	CashUnitOfWork,
	CloseCashSessionInput,
	OpenCashSessionInput,
	RegisterCashDepositInput,
	RegisterCashWithdrawalInput,
} from "../application";
import {
	calculateCashDifference,
	CashError,
	isCashError,
	normalizeMovementReason,
	validateCountedCash,
	validateMovementAmount,
	validateOpeningCash,
} from "../domain";
import { cashMovementFromRecord, cashSessionFromRecord } from "./cash-record-mappers";
import { calculateOpenSessionSummary } from "./cash-summary-builder";

interface CashDependencies {
	createId(): string;
	now(): number;
}

const defaults: CashDependencies = { createId, now: nowTimestamp };

export class DexieCashUnitOfWork implements CashUnitOfWork {
	constructor(
		private readonly database: BodegixDatabase,
		private readonly dependencies: CashDependencies = defaults,
	) {}

	async openSession(input: OpenCashSessionInput) {
		validateOpeningCash(input.openingCashCents);
		try {
			return await runWithDatabaseWriteAccess(() =>
				this.database.transaction("rw", this.database.cashSessions, async () => {
					const open = await this.database.cashSessions.where("status").equals("open").first();
					if (open) throw new CashError("CASH_SESSION_ALREADY_OPEN");
					const record: CashSessionRecord = {
						id: this.dependencies.createId(),
						status: "open",
						openingCashCents: input.openingCashCents,
						completedSalesCount: null,
						totalSalesCents: null,
						cashSalesCents: null,
						yapeSalesCents: null,
						plinSalesCents: null,
						cardSalesCents: null,
						bankTransferSalesCents: null,
						manualDepositsCents: null,
						manualWithdrawalsCents: null,
						expectedCashCents: null,
						countedCashCents: null,
						differenceCents: null,
						openedAt: this.dependencies.now(),
						closedAt: null,
					};
					await this.database.cashSessions.add(record);
					return cashSessionFromRecord(record);
				}),
			);
		} catch (error) {
			this.rethrow(error);
		}
	}

	registerDeposit(input: RegisterCashDepositInput) {
		return this.registerMovement("deposit", input);
	}

	registerWithdrawal(input: RegisterCashWithdrawalInput) {
		return this.registerMovement("withdrawal", input);
	}

	async closeSession(input: CloseCashSessionInput) {
		validateCountedCash(input.countedCashCents);
		try {
			return await runWithDatabaseWriteAccess(() =>
				this.database.transaction(
					"rw",
					[
						this.database.cashSessions,
						this.database.cashMovements,
						this.database.sales,
						this.database.salePayments,
					],
					async () => {
						const session = await this.database.cashSessions.get(input.cashSessionId);
						if (!session) throw new CashError("CASH_SESSION_NOT_FOUND");
						if (session.status === "closed") throw new CashError("CASH_SESSION_ALREADY_CLOSED");
						const summary = await calculateOpenSessionSummary(this.database, session);
						const differenceCents = calculateCashDifference(
							summary.expectedCashCents,
							input.countedCashCents,
						);
						const latestMovement = await this.database.cashMovements
							.where("[cashSessionId+createdAt]")
							.between([session.id, Dexie.minKey], [session.id, Dexie.maxKey])
							.last();
						const closedAt = Math.max(
							this.dependencies.now(),
							session.openedAt + 1,
							(latestMovement?.createdAt ?? -1) + 1,
						);
						await this.database.cashSessions.update(session.id, {
							status: "closed",
							completedSalesCount: summary.completedSalesCount,
							totalSalesCents: summary.totalSalesCents,
							cashSalesCents: summary.paymentTotals.cashCents,
							yapeSalesCents: summary.paymentTotals.yapeCents,
							plinSalesCents: summary.paymentTotals.plinCents,
							cardSalesCents: summary.paymentTotals.cardCents,
							bankTransferSalesCents: summary.paymentTotals.bankTransferCents,
							manualDepositsCents: summary.manualDepositsCents,
							manualWithdrawalsCents: summary.manualWithdrawalsCents,
							expectedCashCents: summary.expectedCashCents,
							countedCashCents: input.countedCashCents,
							differenceCents,
							closedAt,
						});
						return {
							...summary,
							status: "closed" as const,
							countedCashCents: input.countedCashCents,
							differenceCents,
							closedAt,
							snapshotAvailable: true,
						};
					},
				),
			);
		} catch (error) {
			this.rethrow(error);
		}
	}

	private async registerMovement(type: "deposit" | "withdrawal", input: RegisterCashDepositInput) {
		validateMovementAmount(input.amountCents);
		const reason = normalizeMovementReason(input.reason);
		try {
			return await runWithDatabaseWriteAccess(() =>
				this.database.transaction(
					"rw",
					[
						this.database.cashSessions,
						this.database.cashMovements,
						this.database.sales,
						this.database.salePayments,
					],
					async () => {
						const session = await this.database.cashSessions.get(input.cashSessionId);
						if (!session) throw new CashError("CASH_SESSION_NOT_FOUND");
						if (session.status !== "open") throw new CashError("CASH_SESSION_NOT_OPEN");
						if (type === "withdrawal") {
							const summary = await calculateOpenSessionSummary(this.database, session);
							if (input.amountCents > summary.expectedCashCents) {
								throw new CashError("INSUFFICIENT_EXPECTED_CASH", { field: "amount" });
							}
						}
						const latest = await this.database.cashMovements
							.where("[cashSessionId+createdAt]")
							.between([session.id, Dexie.minKey], [session.id, Dexie.maxKey])
							.last();
						const record = {
							id: this.dependencies.createId(),
							cashSessionId: session.id,
							type,
							amountCents: input.amountCents,
							reason,
							createdAt: Math.max(
								this.dependencies.now(),
								session.openedAt,
								(latest?.createdAt ?? -1) + 1,
							),
						};
						await this.database.cashMovements.add(record);
						return cashMovementFromRecord(record);
					},
				),
			);
		} catch (error) {
			this.rethrow(error);
		}
	}

	private rethrow(error: unknown): never {
		if (isCashError(error)) throw error;
		throw new CashError("CASH_PERSISTENCE_FAILED", { cause: error });
	}
}
