import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function NotFound() {
	const { t } = useTranslation("platform");
	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-20 text-center">
			<h1 className="text-8xl text-primary">{t("not_found.title")}</h1>
			<p className="text-4xl">{t("not_found.description")}</p>
			<p className="text-4xl">
				{t("not_found.go_back")}{" "}
				<Link className="text-primary hover:underline" to="/">
					{t("not_found.home")}
				</Link>
				?
			</p>
		</div>
	);
}
