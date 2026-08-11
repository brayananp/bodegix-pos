import {
	type CriticalOperationBlocker,
	getOperationSafetyCoordinator,
} from "@/shared/infrastructure/operation-safety";
import { useEffect } from "react";

export function useOperationBlocker(blocker: CriticalOperationBlocker, active: boolean): void {
	useEffect(() => {
		if (!active) return;
		return getOperationSafetyCoordinator().register(blocker);
	}, [active, blocker]);
}
