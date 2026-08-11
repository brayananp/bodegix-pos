export type DailyOperationalStatus = "no_activity" | "in_progress" | "ready_for_review";
export type DailyChecklistStatus = "pass" | "warning" | "fail";
export type DailyCloseAction = "cash" | "sale" | "diagnostics" | "backup";
export type DailyBackupStatus = "never" | "up_to_date" | "due_soon" | "overdue";
export type ReportingPaymentMethod = "cash" | "yape" | "plin" | "card" | "bank_transfer";

export interface DailySalesSummary {
	readonly completedSalesCount: number;
	readonly completedSalesCents: number;
	readonly voidedSalesCreatedCount: number;
	readonly voidedSalesCreatedCents: number;
	readonly voidOperationsCount: number;
	readonly voidOperationsCents: number;
	readonly lineCount: number;
	readonly unitCount: number;
	readonly averageTicketCents: number;
}

export interface DailyPaymentSummary {
	readonly cashCents: number;
	readonly yapeCents: number;
	readonly plinCents: number;
	readonly cardCents: number;
	readonly bankTransferCents: number;
	readonly totalCents: number;
}

export interface DailyCashSessionSummary {
	readonly id: string;
	readonly status: "open" | "closed";
	readonly openingCashCents: number;
	readonly cashSalesCents: number;
	readonly manualDepositsCents: number;
	readonly manualWithdrawalsCents: number;
	readonly expectedCashCents: number | null;
	readonly countedCashCents: number | null;
	readonly differenceCents: number | null;
	readonly openedAt: number;
	readonly closedAt: number | null;
	readonly openedBeforeSelectedDay: boolean;
	readonly closedAfterSelectedDay: boolean;
}

export interface DailyCashSummary {
	readonly relatedSessionCount: number;
	readonly openSessionCount: number;
	readonly closedSessionCount: number;
	readonly cashSalesCents: number;
	readonly manualDepositsCents: number;
	readonly manualWithdrawalsCents: number;
	readonly netOperationalCashFlowCents: number;
	readonly closedSessionDifferenceCents: number;
	readonly sessions: DailyCashSessionSummary[];
}

export interface DailyInventorySummary {
	readonly initialStockUnits: number;
	readonly purchaseEntryUnits: number;
	readonly adjustmentInUnits: number;
	readonly adjustmentOutUnits: number;
	readonly damagedUnits: number;
	readonly expiredUnits: number;
	readonly soldUnits: number;
	readonly restoredByVoidUnits: number;
	readonly currentLowStockProducts: number;
	readonly currentOutOfStockProducts: number;
	readonly currentProductsWithoutMovements: number;
}

export interface DailyTopProduct {
	readonly productId: string;
	readonly productName: string;
	readonly unitsSold: number;
	readonly revenueCents: number;
	readonly lineCount: number;
}

export interface DailyRecentSale {
	readonly id: string;
	readonly saleNumber: number;
	readonly formattedSaleNumber: string;
	readonly totalCents: number;
	readonly paymentMethods: ReportingPaymentMethod[];
	readonly createdAt: number;
}

export interface DailyCloseChecklistItem {
	readonly id: string;
	readonly status: DailyChecklistStatus;
	readonly title: string;
	readonly description: string;
	readonly action: DailyCloseAction | null;
}

export interface DailyCloseChecklist {
	readonly cashSessionsClosed: boolean;
	readonly saleDraftEmpty: boolean;
	readonly salesConsistent: boolean;
	readonly paymentsConsistent: boolean;
	readonly status: DailyChecklistStatus;
	readonly items: DailyCloseChecklistItem[];
}

export interface DailyOperationalSummary {
	readonly date: string;
	readonly timezone: string;
	readonly periodStart: number;
	readonly periodEndExclusive: number;
	readonly generatedAt: number;
	readonly status: DailyOperationalStatus;
	readonly sales: DailySalesSummary;
	readonly payments: DailyPaymentSummary;
	readonly cash: DailyCashSummary;
	readonly inventory: DailyInventorySummary;
	readonly topProducts: DailyTopProduct[];
	readonly recentSales: DailyRecentSale[];
	readonly closeChecklist: DailyCloseChecklist;
}

export interface DailyOperationalStatusInput {
	readonly hasActivity: boolean;
	readonly openSessionCount: number;
}

export interface DailyCloseChecklistInput {
	readonly openSessionCount: number;
	readonly saleDraftItemCount: number;
	readonly salesConsistent: boolean;
	readonly paymentsConsistent: boolean;
	readonly backupStatus: DailyBackupStatus;
}
