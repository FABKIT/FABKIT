import { useTranslation } from "react-i18next";
import { ELIGIBLE_TYPES } from "../config";

export function TypeChipsRow() {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex w-full max-w-160 flex-col items-center gap-2">
			<span className="text-xs font-medium tracking-wide text-muted uppercase">
				{t("play.possible_types")}
			</span>
			<div className="flex flex-wrap justify-center gap-2">
				{ELIGIBLE_TYPES.map((type) => (
					<span
						key={type}
						className="rounded-full border border-border-primary px-3 py-1 text-center text-xs text-muted"
					>
						{t(`types.${type}`)}
					</span>
				))}
			</div>
		</div>
	);
}
