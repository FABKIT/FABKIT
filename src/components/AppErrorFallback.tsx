import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bug, Home } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { generateBugReport } from "../services/bug-report";

interface AppErrorFallbackProps {
	error: Error;
	resetErrorBoundary: () => void;
}

export function AppErrorFallback({ error }: AppErrorFallbackProps) {
	const { t } = useTranslation();
	const [generating, setGenerating] = useState(false);

	async function handleGenerateReport() {
		setGenerating(true);
		try {
			await generateBugReport();
		} finally {
			setGenerating(false);
		}
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
			<div className="w-full max-w-2xl rounded-xl border border-border-primary bg-surface p-8 flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<AlertTriangle className="text-heading shrink-0" size={28} />
					<h1 className="text-heading text-2xl font-bold">
						{t("error_boundary.title")}
					</h1>
				</div>

				<p className="text-body">{t("error_boundary.description")}</p>

				<details className="rounded-lg bg-surface-muted p-4">
					<summary className="text-muted cursor-pointer select-none text-sm font-medium">
						{t("error_boundary.details_toggle")}
					</summary>
					<pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted font-mono leading-relaxed">
						{error.message}
						{error.stack ? `\n\n${error.stack}` : ""}
					</pre>
				</details>

				<div className="flex flex-col sm:flex-row gap-3">
					<button
						type="button"
						onClick={handleGenerateReport}
						disabled={generating}
						className="flex items-center justify-center gap-2 rounded-lg bg-surface-active px-4 py-2.5 text-sm font-medium text-body hover:opacity-80 disabled:opacity-50 transition-opacity"
					>
						<Bug size={16} />
						{generating
							? t("error_boundary.generating_report")
							: t("error_boundary.generate_report")}
					</button>

					<Link
						to="/"
						className="flex items-center justify-center gap-2 rounded-lg border border-border-primary px-4 py-2.5 text-sm font-medium text-body hover:opacity-80 transition-opacity"
					>
						<Home size={16} />
						{t("error_boundary.go_home")}
					</Link>
				</div>

				<div className="rounded-lg bg-surface-muted px-4 py-3 flex flex-col gap-1">
					<p className="text-muted text-sm">
						{t("error_boundary.github_prompt")}
					</p>
					<a
						href="https://github.com/FABKIT/FABKIT/issues/new/choose"
						target="_blank"
						rel="noopener noreferrer"
						className="text-heading text-sm font-medium hover:underline w-fit"
					>
						{t("error_boundary.github_link_text")} ↗
					</a>
				</div>
			</div>
		</div>
	);
}
