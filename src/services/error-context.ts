interface BoundaryErrorContext {
	error: unknown | null;
	componentStack: string;
}

let _ctx: BoundaryErrorContext = { error: null, componentStack: "" };

export function setLastBoundaryError(ctx: BoundaryErrorContext): void {
	_ctx = ctx;
}

export function getLastBoundaryError(): BoundaryErrorContext {
	return _ctx;
}

export function clearLastBoundaryError(): void {
	_ctx = { error: null, componentStack: "" };
}
