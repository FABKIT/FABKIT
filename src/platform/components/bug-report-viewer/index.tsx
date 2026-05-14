import {
	ChevronDown,
	ChevronUp,
	RotateCcw,
} from "lucide-react";
import type * as React from "react";
import { useTranslation } from "react-i18next";

export interface FabreportConsoleEntry {
	level: "error" | "warn" | "info" | "debug" | "unhandled";
	message: string;
	timestamp: number;
	stack?: string;
}

export function UserField({
	label,
	value,
	emptyLabel,
}: {
	label: string;
	value: string | null;
	emptyLabel: string;
}) {
	return (
		<div className="rounded-lg border border-border-primary bg-surface-muted p-4">
			<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
				{label}
			</p>
			{value ? (
				<p className="whitespace-pre-wrap text-sm text-body">{value}</p>
			) : (
				<p className="text-sm italic text-faint">{emptyLabel}</p>
			)}
		</div>
	);
}

export function MetaField({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="rounded-lg border border-border-primary bg-surface-muted p-4">
			<p className="mb-1 text-xs font-semibold uppercase tracking-wider text-subtle">
				{label}
			</p>
			<p className={`break-all text-sm text-body ${mono ? "font-mono" : ""}`}>
				{value}
			</p>
		</div>
	);
}

const consoleLevelStyles: Record<
	FabreportConsoleEntry["level"],
	{ card: string; badge: string }
> = {
	error: {
		card: "border-red-500/30 bg-red-500/5",
		badge: "bg-red-500/10 text-red-500",
	},
	warn: {
		card: "border-amber-500/30 bg-amber-500/5",
		badge: "bg-amber-500/10 text-amber-500",
	},
	unhandled: {
		card: "border-purple-500/30 bg-purple-500/5",
		badge: "bg-purple-500/10 text-purple-400",
	},
	info: {
		card: "border-border-primary bg-surface-muted/50",
		badge: "bg-surface-active text-muted",
	},
	debug: {
		card: "border-border-primary bg-surface-muted/30",
		badge: "bg-surface-active text-faint",
	},
};

export function ConsoleLogEntry({ entry }: { entry: FabreportConsoleEntry }) {
	const { t } = useTranslation("platform");
	const styles = consoleLevelStyles[entry.level];

	return (
		<div className={`rounded-md border px-4 py-3 ${styles.card}`}>
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="flex flex-1 items-start gap-3">
					<span
						className={`mt-0.5 flex-shrink-0 rounded px-2 py-0.5 font-mono text-xs font-semibold ${styles.badge}`}
					>
						{entry.level}
					</span>
					<p className="break-all font-mono text-sm text-body">
						{entry.message}
					</p>
				</div>
				<span className="flex-shrink-0 font-mono text-xs text-faint">
					{new Date(entry.timestamp).toLocaleTimeString()}
				</span>
			</div>
			{entry.stack && (
				<details className="mt-2">
					<summary className="cursor-pointer text-xs text-subtle hover:text-muted">
						{t("bug_report_viewer.stack_trace")}
					</summary>
					<pre className="mt-2 overflow-x-auto rounded bg-surface p-3 font-mono text-xs text-subtle">
						{entry.stack}
					</pre>
				</details>
			)}
		</div>
	);
}

export function RestoreButton({
	label,
	loading,
	onClick,
}: {
	label: string;
	loading: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			disabled={loading}
			className="flex items-center gap-1.5 rounded-md border border-border-primary bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface-muted hover:text-body disabled:cursor-not-allowed disabled:opacity-50"
		>
			<RotateCcw
				className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
			/>
			{label}
		</button>
	);
}

export function CollapsibleJsonSection({
	title,
	icon,
	data,
	expanded,
	onToggle,
	count,
	itemsLabel,
	action,
}: {
	title: string;
	icon: React.ReactNode;
	data: unknown;
	expanded: boolean;
	onToggle: () => void;
	count?: number;
	itemsLabel: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
			<div className="flex items-center justify-between border-b border-border-primary bg-surface-muted px-6 py-4">
				<button
					type="button"
					onClick={onToggle}
					className="flex flex-1 items-center gap-3 text-left"
				>
					{icon}
					<h2 className="text-xl font-semibold text-heading">{title}</h2>
					{count !== undefined && (
						<span className="rounded-full border border-border-primary bg-surface px-2.5 py-0.5 text-xs text-subtle">
							{count} {itemsLabel}
						</span>
					)}
					{expanded ? (
						<ChevronUp className="ml-auto h-5 w-5 text-muted" />
					) : (
						<ChevronDown className="ml-auto h-5 w-5 text-muted" />
					)}
				</button>
				{action && <div className="ml-4 flex-shrink-0">{action}</div>}
			</div>
			{expanded && (
				<div className="p-6">
					<pre className="max-h-96 overflow-auto rounded-lg border border-border-primary bg-surface-muted p-4 font-mono text-xs text-body">
						{JSON.stringify(data, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}
