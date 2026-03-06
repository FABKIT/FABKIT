import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardArtworkCreditsField } from "../components/card-creator/fields/CardArtworkCreditsField.tsx";
import { CardArtworkField } from "../components/card-creator/fields/CardArtworkField.tsx";
import { CardArtworkPositionContainer } from "../components/card-creator/fields/CardArtworkPositionContainer.tsx";
import { CardBackField } from "../components/card-creator/fields/CardBackField.tsx";
import { CardBackStyleField } from "../components/card-creator/fields/CardBackStyleField.tsx";
import { CardClassField } from "../components/card-creator/fields/CardClassField.tsx";
import { CardDefenseField } from "../components/card-creator/fields/CardDefenseField.tsx";
import { CardHeroIntellectField } from "../components/card-creator/fields/CardHeroIntellectField.tsx";
import { CardLifeField } from "../components/card-creator/fields/CardLifeField.tsx";
import { CardMacroGroupField } from "../components/card-creator/fields/CardMacroGroupField.tsx";
import { CardNameField } from "../components/card-creator/fields/CardNameField.tsx";
import { CardOverlayField } from "../components/card-creator/fields/CardOverlayField.tsx";
import { CardOverlayOpacityField } from "../components/card-creator/fields/CardOverlayOpacityField.tsx";
import { CardPitchField } from "../components/card-creator/fields/CardPitchField.tsx";
import { CardPowerField } from "../components/card-creator/fields/CardPowerField.tsx";
import { CardRarityField } from "../components/card-creator/fields/CardRarityField.tsx";
import { CardResourceField } from "../components/card-creator/fields/CardResourceField.tsx";
import { CardSecondaryClassField } from "../components/card-creator/fields/CardSecondaryClassField.tsx";
import { CardSetnumberField } from "../components/card-creator/fields/CardSetnumberField.tsx";
import { CardSubTypeField } from "../components/card-creator/fields/CardSubTypeField.tsx";
import { CardTalentField } from "../components/card-creator/fields/CardTalentField.tsx";
import { CardTextField } from "../components/card-creator/fields/CardTextField.tsx";
import { CardTypeField } from "../components/card-creator/fields/CardTypeField.tsx";
import { CardWeaponField } from "../components/card-creator/fields/CardWeaponField.tsx";
import { ResetButton } from "../components/card-creator/fields/ResetButton.tsx";
import { SaveButton } from "../components/card-creator/fields/SaveButton.tsx";
import { Renderer } from "../components/card-creator/Renderer.tsx";
import { useCardCreator } from "../stores/card-creator.ts";

export const Route = createFileRoute("/card-creator")({
	component: RouteComponent,
});

function RouteComponent() {
	const previewRef = useRef<SVGSVGElement>(null);
	const { t } = useTranslation();
	const [showResetDialog, setShowResetDialog] = useState(false);
	const reset = useCardCreator((state) => state.reset);
	const setCardType = useCardCreator((state) => state.setCardType);
	const currentCardType = useCardCreator((state) => state.CardType);

	return (
		<div className="flex flex-1 flex-col w-full px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 gap-4 pt-6 sm:pt-8 lg:pt-10">
			{/* Card type selector — full width, above the rest */}
			<CardTypeField />

			<div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3 sm:gap-4">
				<section className="space-y-6">
					{/* Form fields in grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
						<CardPitchField />
						<CardNameField />
						<CardResourceField />
						<CardPowerField />
						<CardHeroIntellectField />
						<CardTalentField />
						<CardClassField />
						<CardSecondaryClassField />
						<CardSubTypeField />
						<CardMacroGroupField />
						<CardWeaponField />
						<CardRarityField />
						<CardLifeField />
						<CardDefenseField />
						<CardArtworkField />
						<CardArtworkCreditsField />
						<CardSetnumberField />
						{import.meta.env.DEV && (
							<>
								<CardOverlayField />
								<CardOverlayOpacityField />
							</>
						)}
						<CardTextField className="col-span-1 sm:col-span-2 xl:col-span-3" />
					</div>
				</section>

				<section className="flex flex-col gap-2 items-center">
					{/* Background label */}
					<p className="w-full text-sm font-medium text-center text-muted">
						{t("card_creator.background_label")}
					</p>

					{/* Style toggle */}
					<div className="flex justify-center">
						<CardBackStyleField />
					</div>

					{/* Cardback arrow selector */}
					<CardBackField />

					{/* Card preview */}
					<div className="w-full max-w-[450px] mt-1">
						<CardArtworkPositionContainer>
							<Renderer ref={previewRef} />
						</CardArtworkPositionContainer>
					</div>

					{/* Action buttons */}
					<div className="flex flex-col gap-3 mt-1 sm:flex-row sm:gap-2">
						<Link
							to="/export"
							className="inline-flex items-center justify-center gap-x-1.5 bg-primary text-sm font-semibold text-white rounded-md px-3.5 py-2.5 hover:opacity-90 transition-opacity"
						>
							{t("card_creator.generate_button_label")}
							<Settings className="w-4 h-4" />
						</Link>

						<SaveButton previewRef={previewRef} />
						<ResetButton onClick={() => setShowResetDialog(true)} />
					</div>
				</section>
			</div>

			{/* Reset confirmation dialog — rendered inline so the card creator stays visible behind the overlay */}
			<Dialog
				open={showResetDialog}
				onClose={() => setShowResetDialog(false)}
				className="relative z-50"
			>
				<DialogBackdrop className="fixed inset-0 bg-black/30" />
				<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
					<DialogPanel className="w-full max-w-md space-y-4 rounded-lg border border-border bg-surface p-6 shadow-xl">
						<DialogTitle className="text-lg font-bold text-heading">
							{t("components.reset-creator.title")}
						</DialogTitle>
						<p className="text-sm text-body">
							{t("components.reset-creator.prompt")}
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								className="inline-flex items-center justify-center rounded-md border border-border px-3.5 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-surface-muted"
								onClick={() => setShowResetDialog(false)}
							>
								{t("components.reset-creator.cancel")}
							</button>
							<button
								type="button"
								className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
								onClick={() => {
									reset();
									if (currentCardType) setCardType(currentCardType);
									setShowResetDialog(false);
								}}
							>
								{t("components.reset-creator.yes")}
							</button>
						</div>
					</DialogPanel>
				</div>
			</Dialog>
		</div>
	);
}
