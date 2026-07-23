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
				<img
					src="/img/fabble/Mischievous-Meeps.webp"
					alt=""
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/25 to-surface" />
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
