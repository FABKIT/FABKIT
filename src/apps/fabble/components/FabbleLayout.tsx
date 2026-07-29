import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "@fabkit/styles/components/fabble.css";

export interface FabbleLayoutProps {
	children: ReactNode;
}

export function FabbleLayout({ children }: FabbleLayoutProps) {
	const { t } = useTranslation("fabble");
	const { pathname } = useLocation();

	return (
		<div className="flex w-full flex-col items-center">
			<div className="relative h-37.5 w-full overflow-hidden sm:h-65">
				{/* Crop window pulled above centre: the banner is a very wide, short strip out of
				    a near-4:3 painting, and centring it landed on the right meep's chest with its
				    head cut off. 30% keeps that head in frame while still catching the top of the
				    left meep. */}
				<img
					src="/img/fabble/Mischievous-Meeps.webp"
					alt=""
					className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
				/>
				{/* Starts at surface/30 rather than transparent: at full brightness the artwork
				    reads as a slab pasted onto the page, worst in dark theme against a near-black
				    background. Tinting with `surface` self-corrects per theme. */}
				<div className="absolute inset-0 bg-gradient-to-b from-surface/30 via-surface/45 to-surface" />
				<div className="absolute inset-x-0 bottom-3 flex justify-center sm:bottom-6">
					<img
						src="/img/fabble/FabbleLogo.svg"
						alt={t("home.logo_alt")}
						className="fabble-logo h-11 sm:h-15"
					/>
				</div>
			</div>
			<div
				key={pathname}
				className="fabble-fade-in flex w-full flex-col items-center px-4 pt-6 pb-12 sm:pt-8 sm:pb-16"
			>
				{children}
			</div>
		</div>
	);
}
