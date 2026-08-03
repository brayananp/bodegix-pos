import {
	type DatabaseDiagnosticReport,
	type DiagnosticMode,
	getLocalDatabase,
	initializeLocalDatabase,
	LocalDatabaseError,
	type LocalDatabaseInitializationResult,
	runDatabaseDiagnostics,
} from "@/shared/infrastructure/local-db";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export type LocalDatabaseStatus =
	| { state: "initializing" }
	| { state: "ready"; result: LocalDatabaseInitializationResult }
	| { state: "error"; error: LocalDatabaseError };

interface LocalDatabaseContextValue {
	status: LocalDatabaseStatus;
	retry(): void;
	runDiagnostics(mode?: DiagnosticMode): Promise<DatabaseDiagnosticReport>;
}

interface LocalDatabaseProviderProps {
	children: ReactNode;
	initialize?: () => Promise<LocalDatabaseInitializationResult>;
	diagnose?: (mode: DiagnosticMode) => Promise<DatabaseDiagnosticReport>;
	initializationTimeoutMs?: number;
}

const LocalDatabaseContext = createContext<LocalDatabaseContextValue | null>(null);

function normalizeError(error: unknown): LocalDatabaseError {
	return error instanceof LocalDatabaseError
		? error
		: new LocalDatabaseError("DATABASE_INITIALIZATION_FAILED", error);
}

export function LocalDatabaseProvider({
	children,
	initialize = initializeLocalDatabase,
	diagnose,
	initializationTimeoutMs = 15_000,
}: LocalDatabaseProviderProps) {
	const [status, setStatus] = useState<LocalDatabaseStatus>({ state: "initializing" });
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		void attempt;
		if (typeof window === "undefined") return;

		let active = true;
		let settled = false;
		setStatus({ state: "initializing" });
		const timeoutId = window.setTimeout(() => {
			if (!active || settled) return;
			settled = true;
			setStatus({
				state: "error",
				error: new LocalDatabaseError(
					"DATABASE_INITIALIZATION_FAILED",
					new Error("Local database initialization timed out"),
				),
			});
		}, initializationTimeoutMs);
		void initialize()
			.then((result) => {
				if (active && !settled) {
					settled = true;
					window.clearTimeout(timeoutId);
					setStatus({ state: "ready", result });
				}
			})
			.catch((error: unknown) => {
				// biome-ignore lint/suspicious/noConsole: la causa completa solo se registra en desarrollo.
				if (import.meta.env.DEV) console.error("Local database initialization failed", error);
				if (active && !settled) {
					settled = true;
					window.clearTimeout(timeoutId);
					setStatus({ state: "error", error: normalizeError(error) });
				}
			});

		return () => {
			active = false;
			window.clearTimeout(timeoutId);
		};
	}, [attempt, initializationTimeoutMs, initialize]);

	const retry = useCallback(() => setAttempt((current) => current + 1), []);
	const runDiagnostics = useCallback(
		(mode: DiagnosticMode = "deep") =>
			diagnose ? diagnose(mode) : runDatabaseDiagnostics(getLocalDatabase(), mode),
		[diagnose],
	);
	const value = useMemo(() => ({ status, retry, runDiagnostics }), [retry, runDiagnostics, status]);

	return (
		<LocalDatabaseContext.Provider value={value}>
			{status.state === "initializing" ? (
				<LocalDatabaseInitializing />
			) : status.state === "error" ? (
				<LocalDatabaseFailure error={status.error} onRetry={retry} />
			) : (
				children
			)}
		</LocalDatabaseContext.Provider>
	);
}

export function useLocalDatabase(): LocalDatabaseContextValue {
	const context = useContext(LocalDatabaseContext);
	if (!context) throw new Error("useLocalDatabase debe usarse dentro de LocalDatabaseProvider");
	return context;
}

function LocalDatabaseInitializing() {
	return (
		<main className="flex min-h-screen items-center justify-center p-6" aria-live="polite">
			<div className="space-y-2 text-center">
				<div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
				<p className="font-medium">Preparando almacenamiento local…</p>
				<p className="text-sm text-muted-foreground">Esto solo debería tomar unos segundos.</p>
			</div>
		</main>
	);
}

function LocalDatabaseFailure({ error, onRetry }: { error: LocalDatabaseError; onRetry(): void }) {
	return (
		<main className="flex min-h-screen items-center justify-center p-6">
			<div className="max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
				<h1 className="text-lg font-semibold">No se pudo preparar el almacenamiento local</h1>
				<p className="text-sm text-muted-foreground">{error.message}</p>
				<p className="text-xs text-muted-foreground">Código: {error.code}</p>
				<button
					type="button"
					onClick={onRetry}
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
				>
					Reintentar
				</button>
			</div>
		</main>
	);
}
