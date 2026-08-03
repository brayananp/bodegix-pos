import { Input } from "@/shared/components/ui/input";
import { useEffect, useRef } from "react";

interface SaleProductSearchProps {
	value: string;
	onChange(value: string): void;
	onBarcodeDetected?(barcode: string): void;
	autoFocus?: boolean;
}

export function SaleProductSearch({
	value,
	onChange,
	onBarcodeDetected,
	autoFocus = true,
}: SaleProductSearchProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (autoFocus) inputRef.current?.focus();
	}, [autoFocus]);

	return (
		<div className="relative">
			<Input
				ref={inputRef}
				type="search"
				placeholder="Buscar producto o escanear código…"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && value.trim() && onBarcodeDetected) {
						e.preventDefault();
						onBarcodeDetected(value.trim());
					}
				}}
				aria-label="Buscar producto"
				className="pr-4"
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck={false}
			/>
		</div>
	);
}
