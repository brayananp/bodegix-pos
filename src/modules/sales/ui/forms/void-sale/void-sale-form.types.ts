import type { PaymentMethod } from "../../../domain";

export interface PaymentReversalFormValue {
	paymentId: string;
	method: PaymentMethod;
	amountCents: number;
	confirmed: boolean;
	reversalReference: string;
}

export interface VoidSaleFormValues {
	reasonPreset: string;
	reasonDetails: string;
	paymentReversals: PaymentReversalFormValue[];
}
