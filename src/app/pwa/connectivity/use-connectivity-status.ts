import { useOnlineStatus } from "@/shared/kernel/network/use-online-status";

export function useConnectivityStatus() {
	const browserOnline = useOnlineStatus();
	return { browserOnline, label: browserOnline ? ("online" as const) : ("offline" as const) };
}
