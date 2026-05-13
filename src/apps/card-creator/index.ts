import { registerReportDataProvider } from "@fabkit/platform/bug-report";
import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator";

registerReportDataProvider("card-creator", () => useCardCreator.getState() as unknown as Record<string, unknown>);
