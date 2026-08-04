import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/shared/components/ui/drawer";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import type { ReactNode } from "react";

interface ResponsiveDialogDrawerProps {
	open: boolean;
	onOpenChange(open: boolean): void;
	title: string;
	description: string;
	children: ReactNode;
}

/**
 * Componente responsivo que muestra Dialog en desktop y Drawer en móvil.
 */
export function ResponsiveDialogDrawer({
	open,
	onOpenChange,
	title,
	description,
	children,
}: ResponsiveDialogDrawerProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
				<DrawerContent className="max-h-[92dvh]">
					<DrawerHeader className="pb-3 text-left">
						<DrawerTitle>{title}</DrawerTitle>
						<DrawerDescription>{description}</DrawerDescription>
					</DrawerHeader>
					{children}
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="flex max-h-[88dvh] flex-col gap-0 sm:max-w-lg"
			>
				<DialogHeader className="shrink-0 border-b pb-4">
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}
