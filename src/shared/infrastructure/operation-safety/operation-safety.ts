export type CriticalOperationBlocker = "dirty_form" | "checkout_in_progress" | "critical_operation";

export interface OperationSafetySnapshot {
	readonly blockers: readonly CriticalOperationBlocker[];
}

type Listener = () => void;

class OperationSafetyCoordinator {
	private readonly counts = new Map<CriticalOperationBlocker, number>();
	private readonly listeners = new Set<Listener>();
	private snapshot: OperationSafetySnapshot = { blockers: [] };

	getSnapshot = (): OperationSafetySnapshot => this.snapshot;

	subscribe = (listener: Listener): (() => void) => {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};

	register(blocker: CriticalOperationBlocker): () => void {
		this.counts.set(blocker, (this.counts.get(blocker) ?? 0) + 1);
		this.publish();
		let active = true;
		return () => {
			if (!active) return;
			active = false;
			const count = this.counts.get(blocker) ?? 0;
			if (count <= 1) this.counts.delete(blocker);
			else this.counts.set(blocker, count - 1);
			this.publish();
		};
	}

	private publish(): void {
		this.snapshot = { blockers: [...this.counts.keys()] };
		for (const listener of this.listeners) listener();
	}
}

const coordinator = new OperationSafetyCoordinator();

export function getOperationSafetyCoordinator(): OperationSafetyCoordinator {
	return coordinator;
}
