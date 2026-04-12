import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
	const { t } = useTranslation();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="size-10 rounded-lg bg-surface-muted animate-pulse" />
		);
	}

	const cycleTheme = () => {
		if (theme === "light") setTheme("dark");
		else if (theme === "dark") setTheme("system");
		else setTheme("light");
	};

	const getIcon = () => {
		switch (theme) {
			case "light":
				return <Sun className="size-5" />;
			case "dark":
				return <Moon className="size-5" />;
			default:
				return <Monitor className="size-5" />;
		}
	};

	const getLabel = () => {
		switch (theme) {
			case "light":
				return t("theme.toggle_light");
			case "dark":
				return t("theme.toggle_dark");
			default:
				return t("theme.toggle_system");
		}
	};

	const getThemeName = () => {
		switch (theme) {
			case "light":
				return t("theme.light");
			case "dark":
				return t("theme.dark");
			default:
				return t("theme.system");
		}
	};

	return (
		<button
			type="button"
			onClick={cycleTheme}
			aria-label={getLabel()}
			className="group flex w-full gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-menu-inactive transition-colors hover:bg-surface-active hover:text-heading"
		>
			<span className="size-6 shrink-0 flex items-center justify-center text-menu-icon-inactive transition-colors group-hover:text-heading">
				{getIcon()}
			</span>
			{getThemeName()}
		</button>
	);
}
