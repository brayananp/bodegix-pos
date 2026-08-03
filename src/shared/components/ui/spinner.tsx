import { cn } from "#/shared/lib/utils.ts";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

function Spinner({ className, strokeWidth: _sw, ...props }: React.ComponentProps<"svg">) {
	return (
		<HugeiconsIcon
			icon={Loading03Icon}
			strokeWidth={2}
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
