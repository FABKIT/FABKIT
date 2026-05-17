import { RulesContent } from "@fabkit/apps/fabble/components/Rules/RulesContent";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/fabble/rules")({
	component: FabbleRulesRoute,
});

function FabbleRulesRoute() {
	const { t } = useTranslation("fabble");

	return (
		<div className="w-full max-w-lg mx-auto px-4 py-8">
			<Link
				to="/fabble"
				className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-heading transition-colors mb-6"
			>
				<ArrowLeft className="size-4" />
				{t("action.back_to_menu")}
			</Link>
			<h1 className="text-2xl font-bold text-heading mb-6">
				{t("rules.title")}
			</h1>
			<RulesContent />
		</div>
	);
}
