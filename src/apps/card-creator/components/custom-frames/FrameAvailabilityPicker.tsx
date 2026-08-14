import {
	FrameFamilies,
	getCardTypesForFamily,
} from "@fabkit/apps/card-creator/config/frame-buckets.ts";
import { CardTypes } from "@fabkit/shared/config/cards/types.ts";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FrameAvailabilityPickerProps {
	selectedKeys: Set<string>;
	onToggle: (key: string) => void;
	/** Buckets this image already occupies. Rendered ticked and disabled, and
	 *  kept out of `selectedKeys` by the caller — never fed back into a save,
	 *  or re-confirming an upload would recreate the exact per-bucket
	 *  duplicates this picker exists to prevent. Upload flow only. */
	lockedKeys?: Set<string>;
}

/**
 * Shared by the upload dialog and the availability-editing dialog on the
 * Custom Frames page, so the two option lists can never drift apart.
 *
 * Renders one block per frame family (Action, Hero, Equipment, …), each with
 * a caption naming the card types it covers and one checkbox per style that
 * family actually has in the manifest — never a hardcoded two, since a
 * family like Event only has one. See config/frame-buckets.ts for how the
 * families and their captions are derived.
 */
export function FrameAvailabilityPicker({
	selectedKeys,
	onToggle,
	lockedKeys,
}: FrameAvailabilityPickerProps) {
	const { t } = useTranslation("card-creator");

	return (
		<div className="space-y-4">
			{FrameFamilies.map((family) => {
				const coveredTypes = getCardTypesForFamily(family.type)
					.map((cardType) => t(CardTypes[cardType].label))
					.join(", ");

				return (
					<div key={family.type} className="space-y-1.5">
						<div>
							<p className="text-sm font-medium text-heading">
								{t(`custom_frames.family.${family.type}`)}
							</p>
							<p className="text-xs text-subtle">{coveredTypes}</p>
						</div>
						<div className="flex flex-wrap gap-2">
							{family.buckets.map((bucket) => {
								const locked = lockedKeys?.has(bucket.key) ?? false;
								const checked = locked || selectedKeys.has(bucket.key);
								return (
									<label
										key={bucket.key}
										className={
											locked
												? "flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border-primary bg-surface-muted px-2.5 py-1.5 text-sm text-subtle"
												: "flex cursor-pointer items-center gap-1.5 rounded-md border border-border-primary px-2.5 py-1.5 text-sm text-body transition-colors hover:bg-surface-muted"
										}
									>
										<input
											type="checkbox"
											checked={checked}
											disabled={locked}
											onChange={() => onToggle(bucket.key)}
											className="h-4 w-4 accent-primary"
										/>
										{t(`custom_frames.style.${bucket.style}`)}
										{checked && !locked && (
											<Check className="h-3.5 w-3.5 text-primary" />
										)}
									</label>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
