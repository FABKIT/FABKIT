import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n.ts";

export function LanguageToggle() {
	const { t } = useTranslation();

	// Only show if multiple languages are available
	if (i18n.languages.length <= 1) return null;

	return (
		<Menu as="div" className="relative">
			<MenuButton
				aria-label={t("theme.toggle_language")}
				className="group flex w-full gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-menu-inactive transition-colors hover:bg-surface-active hover:text-heading"
			>
				<Globe
					className="size-6 shrink-0 text-menu-icon-inactive transition-colors group-hover:text-heading"
					aria-hidden="true"
				/>
				<span className="flex-1 text-left">{i18n.language.toUpperCase()}</span>
			</MenuButton>

			<MenuItems
				anchor="bottom start"
				className="mt-2 w-40 origin-top-left rounded-lg bg-surface shadow-lg ring-1 ring-border focus:outline-none"
			>
				<div className="py-1">
					{i18n.languages.map((lang) => (
						<MenuItem key={lang}>
							{({ focus }) => (
								<button
									type="button"
									onClick={() => i18n.changeLanguage(lang)}
									className={`${
										focus ? "bg-surface-active" : ""
									} group flex w-full items-center justify-between px-4 py-2 text-sm text-body transition-colors`}
								>
									<span className="uppercase">{lang}</span>
									{i18n.language === lang && (
										<Check className="size-4 text-primary" />
									)}
								</button>
							)}
						</MenuItem>
					))}
				</div>
			</MenuItems>
		</Menu>
	);
}
