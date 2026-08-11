import type { ReactNode } from "react";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";

export type SaleMobilePanelMode = "cart" | "checkout" | "result";

const PANEL_TITLES: Record<SaleMobilePanelMode, string> = {
	cart: "Carrito",
	checkout: "Cobrar",
	result: "Venta completada",
};

const PANEL_DESCRIPTIONS: Record<SaleMobilePanelMode, string> = {
	cart: "Revisa los productos y confirma la venta",
	checkout: "Selecciona el método de pago",
	result: "Resumen de la venta registrada",
};

interface SaleMobileSheetProps {
	open: boolean;
	mode: SaleMobilePanelMode;
	onClose(): void;
	children: ReactNode;
}

export function SaleMobileSheet({ open, mode, onClose, children }: SaleMobileSheetProps) {
	return (
		<Sheet
			open={open}
			onOpenChange={(o) => {
				if (!o) onClose();
			}}
		>
			<SheetContent
				side="bottom"
				className="min-h-0 gap-0 overflow-hidden rounded-t-2xl p-0 data-[side=bottom]:h-[92svh]"
				aria-describedby="sale-sheet-description"
			>
				<SheetHeader className="px-4 pt-4 pb-2 shrink-0">
					<SheetTitle>{PANEL_TITLES[mode]}</SheetTitle>
					<SheetDescription id="sale-sheet-description">
						{PANEL_DESCRIPTIONS[mode]}
					</SheetDescription>
				</SheetHeader>
				{mode === "cart" ? (
					<div className="min-h-0 flex-1 px-4 pb-safe">{children}</div>
				) : (
					<ScrollArea className="min-h-0 flex-1 px-4 pb-safe">{children}</ScrollArea>
				)}
			</SheetContent>
		</Sheet>
	);
}
