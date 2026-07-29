import { ELIGIBLE_TYPES } from "@fabkit/apps/fabble/config";
import { useTranslation } from "react-i18next";

export function TypeChipsRow() {
	const { t } = useTranslation("fabble");

	return (
		<div className="flex w-full max-w-160 flex-col items-center gap-1.5">
			<span className="text-xs font-semibold tracking-wider text-subtle uppercase">
				{t("play.possible_types")}
			</span>
			<div className="flex flex-wrap justify-center gap-1.5">
				{ELIGIBLE_TYPES.map((type) => (
					<span
						key={type}
						className="rounded-full border border-border-primary px-2.5 py-0.5 text-center text-xs text-muted"
					>
						{t(`types.${type}`)}
					</span>
				))}
			</div>
		</div>
	);
}
