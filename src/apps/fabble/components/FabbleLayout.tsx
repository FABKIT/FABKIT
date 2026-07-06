import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "../../../styles/components/fabble.css";

interface FabbleLayoutProps {
	children: ReactNode;
}

export function FabbleLayout({ children }: FabbleLayoutProps) {
	const { t } = useTranslation("fabble");
	const { pathname } = useLocation();

	return (
		<div className="flex w-full flex-col items-center">
			<div className="relative h-[160px] w-full overflow-hidden sm:h-[280px]">
				<img
					src="/img/fabble/Mischievous-Meeps.webp"
					alt=""
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
				<div className="absolute inset-x-0 bottom-3 flex justify-center sm:bottom-6">
					<img
						src="/img/fabble/FabbleLogo.svg"
						alt={t("home.logo_alt")}
						className="h-12 sm:h-16"
					/>
				</div>
			</div>
			<div
				key={pathname}
				className="fabble-fade-in flex w-full flex-col items-center px-4 pt-6 sm:pt-8"
			>
				{children}
			</div>
		</div>
	);
}
