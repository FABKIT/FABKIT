export type ReportDataProvider = () => Record<string, unknown>;

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

export function collectAppData(): Record<string, Record<string, unknown>> {
	return providers.reduce<Record<string, Record<string, unknown>>>(
		(acc, { namespace, fn }) => {
			acc[namespace] = fn();
			return acc;
		},
		{},
	);
}
