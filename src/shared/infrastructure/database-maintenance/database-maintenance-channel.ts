import {
	DATABASE_MAINTENANCE_CHANNEL_NAME,
	type DatabaseMaintenanceMessage,
} from "./database-maintenance.types";

export interface DatabaseMaintenanceChannel {
	post(message: DatabaseMaintenanceMessage): void;
	close(): void;
}

export function isBroadcastChannelAvailable(): boolean {
	return typeof globalThis.BroadcastChannel !== "undefined";
}

export function createDatabaseMaintenanceChannel(
	onMessage: (message: DatabaseMaintenanceMessage) => void,
): DatabaseMaintenanceChannel | null {
	if (!isBroadcastChannelAvailable()) return null;
	const channel = new BroadcastChannel(DATABASE_MAINTENANCE_CHANNEL_NAME);
	channel.addEventListener("message", (event: MessageEvent<unknown>) => {
		if (!event.data || typeof event.data !== "object" || !("type" in event.data)) return;
		onMessage(event.data as DatabaseMaintenanceMessage);
	});
	return {
		post: (message) => channel.postMessage(message),
		close: () => channel.close(),
	};
}
