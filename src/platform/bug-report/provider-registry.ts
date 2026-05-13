export interface AppProviderData {
	state: Record<string, unknown>;
	gallery?: unknown;
	rendering?: unknown;
}

export type ReportDataProvider =
	| (() => Promise<AppProviderData>)
	| (() => AppProviderData);

interface RegisteredProvider {
	namespace: string;
	fn: ReportDataProvider;
}

const providers: RegisteredProvider[] = [];

export function registerReportDataProvider(
	namespace: string,
	fn: ReportDataProvider,
): void {
	providers.push({ namespace, fn });
}

export async function collectAppData(): Promise<
	Record<string, AppProviderData>
> {
	const entries = await Promise.all(
		providers.map(async ({ namespace, fn }) => [namespace, await fn()] as const),
	);

	console.debug(`Collected app data from ${providers.length} providers`, entries);
	return Object.fromEntries(entries);
}
