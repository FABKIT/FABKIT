import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	type CardClass,
	CardClasses,
	CardSubtypes,
	type CardTalent,
	CardTalents,
	type CardType,
	CardTypes,
} from "../../../config/cards.ts";
import {
	MELD_EXCLUDED_TYPES,
	useCardCreator,
} from "../../../stores/card-creator.ts";
import { Combobox } from "../../form/Combobox.tsx";
import ImageUpload from "../../form/ImageUpload.tsx";
import RichTextEditor from "../../form/RichTextEditor.tsx";
import type { SelectOption } from "../../form/Select.tsx";
import Select from "../../form/Select.tsx";
import TextInput from "../../form/TextInput.tsx";

export function MeldHalfFields() {
	const { t } = useTranslation();
	const meldActiveHalf = useCardCreator((state) => state.meldActiveHalf);
	const setMeldActiveHalf = useCardCreator((state) => state.setMeldActiveHalf);
	const meldHalfA = useCardCreator((state) => state.meldHalfA);
	const meldHalfB = useCardCreator((state) => state.meldHalfB);
	const setMeldHalfType = useCardCreator((state) => state.setMeldHalfType);
	const setMeldHalfName = useCardCreator((state) => state.setMeldHalfName);
	const setMeldHalfArtwork = useCardCreator(
		(state) => state.setMeldHalfArtwork,
	);
	const setMeldHalfClass = useCardCreator((state) => state.setMeldHalfClass);
	const setMeldHalfSecondaryClass = useCardCreator(
		(state) => state.setMeldHalfSecondaryClass,
	);
	const setMeldHalfSubType = useCardCreator(
		(state) => state.setMeldHalfSubType,
	);
	const setMeldHalfTalent = useCardCreator((state) => state.setMeldHalfTalent);
	const setMeldHalfText = useCardCreator((state) => state.setMeldHalfText);

	const half = meldActiveHalf === "A" ? meldHalfA : meldHalfB;

	const typeOptions: SelectOption<string>[] = useMemo(
		() =>
			Object.keys(CardTypes)
				.filter((key) => !MELD_EXCLUDED_TYPES.includes(key as CardType))
				.sort()
				.map((key) => ({
					value: key,
					label: t(CardTypes[key].label),
				})),
		[t],
	);

	const classOptions: SelectOption<CardClass>[] = useMemo(
		() =>
			Object.keys(CardClasses).map((key) => ({
				value: key as CardClass,
				label: t(CardClasses[key as CardClass]),
			})),
		[t],
	);

	const talentOptions: SelectOption<CardTalent>[] = useMemo(
		() =>
			Object.keys(CardTalents).map((key) => ({
				value: key as CardTalent,
				label: t(CardTalents[key as CardTalent]),
			})),
		[t],
	);

	const subtypeOptions: SelectOption<string>[] = useMemo(() => {
		if (!half.CardType) return [];
		const subtypes = CardSubtypes[half.CardType];
		if (!subtypes) return [];
		return Object.keys(subtypes).map((key) => ({
			value: key,
			label: t(subtypes[key]),
		}));
	}, [half.CardType, t]);

	return (
		<div className="space-y-6">
			{/* Segmented pill tab bar — clearly shows which half is active */}
			<div
				role="tablist"
				aria-label={t("card_creator.meld_half_a_label")}
				className="inline-flex rounded-lg bg-surface-muted p-1 border border-border-primary"
			>
				{(["A", "B"] as const).map((id) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={meldActiveHalf === id}
						onClick={() => setMeldActiveHalf(id)}
						className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
							meldActiveHalf === id
								? "bg-primary text-white shadow-sm"
								: "text-muted hover:text-body"
						}`}
					>
						{t(
							id === "A"
								? "card_creator.meld_half_a_label"
								: "card_creator.meld_half_b_label",
						)}
					</button>
				))}
			</div>

			{/* Active half fields — visual container for clarity.
				key forces remount on tab switch so TipTap + ImageUpload reset to the
				correct half's state rather than carrying the previous half's content. */}
			<div
				key={meldActiveHalf}
				className="border border-border-primary rounded-lg bg-surface-muted p-6 space-y-6"
			>
				{/* Type selector spans full width above the other fields */}
				<Select
					label={t("card_creator.type_label")}
					value={half.CardType || ""}
					onChange={(value) =>
						setMeldHalfType(meldActiveHalf, value as CardType)
					}
					options={typeOptions}
				/>

				{/* Remaining per-half fields */}
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
					<TextInput
						label={t("card_creator.name_label")}
						value={half.CardName || ""}
						onChange={(value) => setMeldHalfName(meldActiveHalf, value)}
						maxLength={50}
					/>

					<Combobox
						label={t("card_creator.talent_label")}
						value={half.CardTalent || "none"}
						onChange={(value) => setMeldHalfTalent(meldActiveHalf, value)}
						options={talentOptions}
					/>

					<Combobox
						label={t("card_creator.class_label")}
						value={half.CardClass || "none"}
						onChange={(value) => setMeldHalfClass(meldActiveHalf, value)}
						options={classOptions}
					/>

					<Combobox
						label={t("card_creator.secondary_class_label")}
						value={half.CardSecondaryClass || "none"}
						onChange={(value) =>
							setMeldHalfSecondaryClass(meldActiveHalf, value)
						}
						options={classOptions}
					/>

					<Combobox
						label={t("card_creator.subtype_label")}
						value={half.CardSubType || "none"}
						onChange={(value) => setMeldHalfSubType(meldActiveHalf, value)}
						options={subtypeOptions}
					/>

					<div>
						<div className="block text-sm font-medium text-muted mb-1">
							{t("card_creator.artwork_label")}
						</div>
						<ImageUpload
							onImageSelect={(blob) => setMeldHalfArtwork(meldActiveHalf, blob)}
						/>
					</div>
				</div>

				{/* Card text — full width */}
				<div>
					<div className="block text-sm font-medium text-muted mb-2">
						{t("card_creator.text_label")}
					</div>
					<RichTextEditor
						content={half.CardTextNode}
						onChange={(html, node) =>
							setMeldHalfText(meldActiveHalf, html, node)
						}
					/>
				</div>
			</div>
		</div>
	);
}
