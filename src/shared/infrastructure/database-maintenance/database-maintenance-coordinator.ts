import { createId } from "@/shared/kernel/ids";
import {
	createDatabaseMaintenanceChannel,
	isBroadcastChannelAvailable,
	type DatabaseMaintenanceChannel,
} from "./database-maintenance-channel";
import {
	isWebLocksAvailable,
	runWithExclusiveDatabaseLock,
	runWithSharedDatabaseLock,
} from "./database-maintenance-lock";
import {
	DatabaseMaintenanceError,
	type DatabaseMaintenanceMessage,
	type DatabaseMaintenanceOperation,
	type DatabaseMaintenanceSnapshot,
	type DatabaseMaintenanceState,
} from "./database-maintenance.types";

type Listener = () => void;

const IDLE: DatabaseMaintenanceState = { state: "idle" };

export class DatabaseMaintenanceCoordinator {
	private readonly tabId = createId();
	private readonly listeners = new Set<Listener>();
	private channel: DatabaseMaintenanceChannel | null | undefined;
	private operationId: string | null = null;
	private remote = false;
	private peers = new Set<string>();
	private state: DatabaseMaintenanceState = IDLE;
	private snapshot: DatabaseMaintenanceSnapshot = {
		state: IDLE,
		remote: false,
		webLocksAvailable: isWebLocksAvailable(),
		broadcastChannelAvailable: isBroadcastChannelAvailable(),
	};

	getSnapshot = (): DatabaseMaintenanceSnapshot => this.snapshot;

	subscribe = (listener: Listener): (() => void) => {
		this.ensureChannel();
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};

	async runWrite<T>(task: () => Promise<T>): Promise<T> {
		if (this.remote || this.state.state === "restoring" || this.state.state === "reinitializing") {
			throw new DatabaseMaintenanceError("DATABASE_MAINTENANCE_ACTIVE");
		}
		return runWithSharedDatabaseLock(task);
	}

	async runExclusive<T>(task: () => Promise<T>): Promise<T> {
		if (this.state.state !== "idle") {
			throw new DatabaseMaintenanceError("DATABASE_MAINTENANCE_ACTIVE");
		}
		this.ensureChannel();
		const operationId = createId();
		this.operationId = operationId;
		this.remote = false;
		this.setState({ state: "preparing", operation: "restore" });
		try {
			if (!isWebLocksAvailable()) await this.assertNoOtherTabs(operationId);
			this.channel?.post({ type: "maintenance-starting", operationId, tabId: this.tabId });
			this.setState({ state: "restoring" });
			const result = await runWithExclusiveDatabaseLock(task);
			this.channel?.post({ type: "maintenance-completed", operationId });
			this.operationId = null;
			this.setState(IDLE);
			return result;
		} catch (error) {
			this.channel?.post({ type: "maintenance-failed", operationId });
			this.operationId = null;
			this.setState({
				state: "error",
				error:
					error instanceof DatabaseMaintenanceError
						? error
						: new DatabaseMaintenanceError("DATABASE_MAINTENANCE_LOCK_UNAVAILABLE", error),
			});
			this.setState(IDLE);
			throw error;
		}
	}

	setLocalState(state: DatabaseMaintenanceState): void {
		if (this.remote) return;
		this.setState(state);
	}

	private ensureChannel(): void {
		if (this.channel !== undefined) return;
		this.channel = createDatabaseMaintenanceChannel((message) => this.receive(message));
	}

	private receive(message: DatabaseMaintenanceMessage): void {
		if ("tabId" in message && message.tabId === this.tabId) return;
		if (message.type === "maintenance-probe") {
			this.channel?.post({
				type: "maintenance-peer",
				operationId: message.operationId,
				tabId: this.tabId,
			});
			return;
		}
		if (message.type === "maintenance-peer" || message.type === "maintenance-ready") {
			if (message.operationId === this.operationId) this.peers.add(message.tabId);
			return;
		}
		if (message.type === "maintenance-starting") {
			this.remote = true;
			this.operationId = message.operationId;
			this.setState({ state: "restoring" });
			this.channel?.post({
				type: "maintenance-ready",
				operationId: message.operationId,
				tabId: this.tabId,
			});
			return;
		}
		if (
			(message.type === "maintenance-completed" || message.type === "maintenance-failed") &&
			message.operationId === this.operationId
		) {
			this.remote = false;
			this.operationId = null;
			this.setState(IDLE);
		}
	}

	private async assertNoOtherTabs(operationId: string): Promise<void> {
		if (!this.channel) return;
		this.peers = new Set();
		this.channel.post({ type: "maintenance-probe", operationId, tabId: this.tabId });
		await new Promise((resolve) => setTimeout(resolve, 180));
		if (this.peers.size > 0) {
			throw new DatabaseMaintenanceError("DATABASE_MAINTENANCE_OTHER_TABS_ACTIVE");
		}
	}

	private setState(state: DatabaseMaintenanceState): void {
		this.state = state;
		this.snapshot = {
			state,
			remote: this.remote,
			webLocksAvailable: this.snapshot.webLocksAvailable,
			broadcastChannelAvailable: this.snapshot.broadcastChannelAvailable,
		};
		for (const listener of this.listeners) listener();
	}
}

const coordinator = new DatabaseMaintenanceCoordinator();

export function getDatabaseMaintenanceCoordinator(): DatabaseMaintenanceCoordinator {
	return coordinator;
}

export function runWithDatabaseWriteAccess<T>(task: () => Promise<T>): Promise<T> {
	return coordinator.runWrite(task);
}

export function runWithExclusiveDatabaseMaintenance<T>(task: () => Promise<T>): Promise<T> {
	return coordinator.runExclusive(task);
}

export function setDatabaseMaintenanceState(state: DatabaseMaintenanceState): void {
	coordinator.setLocalState(state);
}

export function setDatabaseMaintenanceOperation(operation: DatabaseMaintenanceOperation): void {
	coordinator.setLocalState({ state: "preparing", operation });
}
