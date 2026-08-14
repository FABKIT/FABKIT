import {
	FRAME_IMAGE_HEIGHT,
	FRAME_IMAGE_WIDTH,
	MAX_SOURCE_BYTES,
	MAX_SOURCE_DIMENSION,
} from "@fabkit/apps/card-creator/utils/frame-image.ts";
import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
} from "@headlessui/react";
import { ChevronDown, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Collapsible "what makes a good frame image" panel, shown under the upload
 * box in step 1 of CustomFrameDialog. Deliberately not a Tooltip — Tooltip
 * hides itself on pointer-coarse devices, which would make required specs
 * invisible on mobile, and not a second Dialog stacked on this one.
 */
export function FrameGuidelines() {
	const { t } = useTranslation("card-creator");

	return (
		<Disclosure>
			{({ open }) => (
				<div className="rounded-md border border-border-primary">
					<DisclosureButton className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted transition-colors hover:text-heading">
						<Info className="h-4 w-4 shrink-0" />
						<span className="flex-1">
							{t("custom_frames.guidelines.trigger")}
						</span>
						<ChevronDown
							className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
						/>
					</DisclosureButton>
					<DisclosurePanel className="space-y-2 border-t border-border-primary px-3 py-2 text-xs text-muted">
						<dl className="space-y-1.5">
							<div>
								<dt className="font-medium text-subtle">
									{t("custom_frames.guidelines.size_label")}
								</dt>
								<dd>
									{t("custom_frames.guidelines.size_value", {
										width: FRAME_IMAGE_WIDTH,
										height: FRAME_IMAGE_HEIGHT,
									})}
								</dd>
							</div>
							<div>
								<dt className="font-medium text-subtle">
									{t("custom_frames.guidelines.formats_label")}
								</dt>
								<dd>{t("custom_frames.guidelines.formats_value")}</dd>
							</div>
							<div>
								<dt className="font-medium text-subtle">
									{t("custom_frames.guidelines.limits_label")}
								</dt>
								<dd>
									{t("custom_frames.guidelines.limits_value", {
										maxSizeMb: MAX_SOURCE_BYTES / (1024 * 1024),
										maxDimension: MAX_SOURCE_DIMENSION,
									})}
								</dd>
							</div>
							<div>
								<dt className="font-medium text-subtle">
									{t("custom_frames.guidelines.cropping_label")}
								</dt>
								<dd>{t("custom_frames.guidelines.cropping_value")}</dd>
							</div>
						</dl>
					</DisclosurePanel>
				</div>
			)}
		</Disclosure>
	);
}
