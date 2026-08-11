import { useState } from "react";
import type { RegisterSWOptions } from "vite-plugin-pwa/types";

export function useRegisterSW(_options?: RegisterSWOptions) {
	return {
		needRefresh: useState(false),
		offlineReady: useState(false),
		updateServiceWorker: async () => undefined,
	};
}
