import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GUESS_LIMITS } from "../../lib/constants";
import { FabbleHeader } from "../FabbleHeader";
import { ModeCard } from "./ModeCard";

export function ModeSelect() {
	const { t } = useTranslation("fabble");

	return (
		<div className="fabble-page-enter flex flex-col items-center w-full">
			{/* Full-width header */}
			<FabbleHeader />

			<div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4 pb-8 gap-8">
				<div className="flex flex-col items-center gap-3 text-center">
					<p className="text-base text-muted">{t("landing.description")}</p>
					<Link
						to="/fabble/rules"
						className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted hover:text-heading hover:border-border-primary transition-colors min-h-[36px]"
					>
						<HelpCircle className="size-4" />
						{t("action.view_rules")}
					</Link>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
					<ModeCard mode="standard" guessLimit={GUESS_LIMITS.standard} />
					<ModeCard mode="chaos" guessLimit={GUESS_LIMITS.chaos} />
				</div>
			</div>
		</div>
	);
}


