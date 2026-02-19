import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
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
	const CardType = useCardCreator((state) => state.CardType);
	const previewRef = useRef<SVGSVGElement>(null);

	if (CardType === null) {
		return (
			<div className="flex flex-1 flex-col justify-center items-center gap-8">
				<h2 className="text-4xl font-bold text-heading">Start creating!</h2>
				<div className="w-64">
					<CardTypeField />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col md:flex-row p-4 gap-4">
			<section className="space-y-6">
				{/* Form fields in grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
					<CardTypeField />
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

			<section className="flex flex-col gap-4">
				{/* Card background selector placeholder */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-center text-muted">
						Select Card Background
					</h3>
					<div className="flex items-center justify-center gap-4 p-2 bg-surface">
						<CardBackStyleField />
					</div>
					<div className="p-3 bg-surface text-sm text-muted">
						<CardBackField />
					</div>
				</div>

				{/* Card preview */}
				<div className="min-w-full md:min-w-96">
					<CardArtworkPositionContainer>
						<Renderer ref={previewRef} />
					</CardArtworkPositionContainer>
				</div>

				{/* Action buttons */}
				<Link
					to="/export"
					className="px-6 py-3 bg-primary disabled:bg-border text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
				>
					Generate
				</Link>

				<SaveButton previewRef={previewRef} />
				<ResetButton />
			</section>
		</div>
	);
}
