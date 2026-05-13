import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator";
import { registerReportDataProvider } from "@fabkit/platform/bug-report";

registerReportDataProvider(
	"card-creator",
	() => useCardCreator.getState() as unknown as Record<string, unknown>,
);
