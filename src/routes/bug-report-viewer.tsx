import { createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	CircleAlert,
	CircleCheck,
	Clock,
	Database,
	FileText,
	Globe,
	Images,
	Layers,
	MessageCircle,
	Monitor,
	RefreshCw,
	RotateCcw,
	Sliders,
	Terminal,
	Upload,
	User,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardBacks } from "../config/cards/card_backs";
import { initCardDatabase } from "../persistence/card-storage";
import type { CardCreatorState } from "../stores/card-creator";
import { useCardCreator } from "../stores/card-creator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FabreportConsoleEntry {
	level: "error" | "warn" | "unhandled";
	message: string;
	timestamp: number;
	stack?: string;
}

interface FabreportRouterMatch {
	id: string;
	pathname: string;
	params: Record<string, string>;
	search: string;
}

interface Fabreport {
	meta: {
		appVersion: string;
		timestamp: string;
		url: string;
		userAgent: string;
		language: string;
		screenResolution: string;
		viewport: string;
		timezone: string;
		router: {
			location: unknown;
			matches: FabreportRouterMatch[];
		};
	};
	user: {
		whatBroke: string | null;
		lastActions: string | null;
		comments: string | null;
	};
	rendering?: {
		cardBackRenderer: string | null;
		resolvedConfig: unknown | null;
	};
	store: unknown;
	gallery: unknown[];
	console: FabreportConsoleEntry[];
	screenshot: string | null;
	boundaryError?: {
		message: string;
		stack?: string;
		componentStack?: string;
	} | null;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/bug-report-viewer")({
	component: BugReportViewer,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts a base64 data URL back to a Blob. */
async function base64ToBlob(dataUrl: string): Promise<Blob> {
	const res = await fetch(dataUrl);
	return res.blob();
}

/** IndexedDB store name — must match card-storage.ts */
const IDB_STORE_NAME = "cards";

/** Restores serialized store state into the card creator. */
async function restoreStore(raw: unknown): Promise<void> {
	const s = raw as Record<string, unknown>;

	const [artwork, overlay, meldHalfAArtwork, meldHalfBArtwork] =
		await Promise.all([
			typeof s.CardArtwork === "string"
				? base64ToBlob(s.CardArtwork)
				: Promise.resolve(null),
			typeof s.CardOverlay === "string"
				? base64ToBlob(s.CardOverlay)
				: Promise.resolve(null),
			typeof (s.meldHalfA as { CardArtwork?: unknown } | undefined)
				?.CardArtwork === "string"
				? base64ToBlob((s.meldHalfA as { CardArtwork: string }).CardArtwork)
				: Promise.resolve(null),
			typeof (s.meldHalfB as { CardArtwork?: unknown } | undefined)
				?.CardArtwork === "string"
				? base64ToBlob((s.meldHalfB as { CardArtwork: string }).CardArtwork)
				: Promise.resolve(null),
		]);

	// serializeValue preserves the CardBack object; resolve to the real config object by id.
	const cardBackRaw = s.CardBack as { id: number } | null;
	const cardBack = cardBackRaw
		? (CardBacks.find((b) => b.id === cardBackRaw.id) ?? CardBacks[0])
		: null;

	useCardCreator.getState().loadCard({
		...(s as Partial<CardCreatorState>),
		CardArtwork: artwork,
		CardOverlay: overlay,
		CardBack: cardBack,
		meldHalfA:
			s.meldHalfA && typeof s.meldHalfA === "object"
				? {
						...(s.meldHalfA as CardCreatorState["meldHalfA"]),
						CardArtwork: meldHalfAArtwork,
					}
				: undefined,
		meldHalfB:
			s.meldHalfB && typeof s.meldHalfB === "object"
				? {
						...(s.meldHalfB as CardCreatorState["meldHalfB"]),
						CardArtwork: meldHalfBArtwork,
					}
				: undefined,
	});
}

/**
 * Replaces the entire gallery in IndexedDB with the items from the report.
 * Each gallery item has Blobs serialized as base64 data URLs.
 */
async function restoreGallery(items: unknown[]): Promise<void> {
	const db = await initCardDatabase();

	// Wipe existing gallery.
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction([IDB_STORE_NAME], "readwrite");
		tx.objectStore(IDB_STORE_NAME).clear();
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});

	for (const raw of items) {
		const item = raw as {
			version: string;
			cardName: string;
			createdAt: number;
			updatedAt: number;
			preview: string;
			state: Record<string, unknown>;
		};

		const [
			preview,
			cardArtwork,
			cardOverlay,
			meldHalfAArtwork,
			meldHalfBArtwork,
		] = await Promise.all([
			base64ToBlob(item.preview),
			typeof item.state.CardArtwork === "string"
				? base64ToBlob(item.state.CardArtwork)
				: Promise.resolve(null),
			typeof item.state.CardOverlay === "string"
				? base64ToBlob(item.state.CardOverlay)
				: Promise.resolve(null),
			typeof (item.state.meldHalfA as { CardArtwork?: unknown } | undefined)
				?.CardArtwork === "string"
				? base64ToBlob(
						(item.state.meldHalfA as { CardArtwork: string }).CardArtwork,
					)
				: Promise.resolve(null),
			typeof (item.state.meldHalfB as { CardArtwork?: unknown } | undefined)
				?.CardArtwork === "string"
				? base64ToBlob(
						(item.state.meldHalfB as { CardArtwork: string }).CardArtwork,
					)
				: Promise.resolve(null),
		]);

		const storedCard = {
			version: item.version,
			cardName: item.cardName,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
			preview,
			state: {
				...item.state,
				CardArtwork: cardArtwork,
				CardOverlay: cardOverlay,
				meldHalfA:
					item.state.meldHalfA && typeof item.state.meldHalfA === "object"
						? {
								...item.state.meldHalfA,
								CardArtwork: meldHalfAArtwork,
							}
						: undefined,
				meldHalfB:
					item.state.meldHalfB && typeof item.state.meldHalfB === "object"
						? {
								...item.state.meldHalfB,
								CardArtwork: meldHalfBArtwork,
							}
						: undefined,
			},
		};

		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction([IDB_STORE_NAME], "readwrite");
			tx.objectStore(IDB_STORE_NAME).put(storedCard);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}
}

function buildClaudePrompt(report: Fabreport): string {
	const lines: string[] = [
		`I'm debugging a bug report from FABKIT, app version (https://github.com/FABKIT/FABKIT/commit/${report.meta.appVersion}).`,
		"",
	];

	const { whatBroke, lastActions, comments } = report.user;
	if (whatBroke) lines.push(`What broke: ${whatBroke ?? "unspecified"}`);
	if (lastActions)
		lines.push(`Last actions before the bug: ${lastActions ?? "unspecified"}`);
	if (comments) lines.push(`Additional comments: ${comments ?? "unspecified"}`);
	lines.push("");

	if (report.boundaryError) {
		lines.push("## Crash Error");
		lines.push(`Message: ${report.boundaryError.message}`);
		if (report.boundaryError.stack) {
			const stack = report.boundaryError.stack.slice(0, 1500);
			lines.push("");
			lines.push(`<stack_trace>`);
			lines.push(`${stack}`);
			lines.push("</stack_trace>");
		}
		lines.push("");
	}

	const errors = report.console.filter((e) => e.level === "error").slice(0, 5);
	const warns = report.console.filter((e) => e.level === "warn").slice(0, 3);
	const unhandled = report.console
		.filter((e) => e.level === "unhandled")
		.slice(0, 3);

	if (errors.length > 0) {
		lines.push("## Console Errors");
		for (const e of errors) {
			lines.push(`- ${e.message}`);
			if (e.stack) lines.push(`  ${e.stack.split("\n")[1]?.trim() ?? ""}`);
		}
		lines.push("");
	}

	if (unhandled.length > 0) {
		lines.push("## Unhandled Rejections");
		for (const e of unhandled) lines.push(`- ${e.message}`);
		lines.push("");
	}

	if (warns.length > 0) {
		lines.push("## Console Warnings");
		for (const e of warns) lines.push(`- ${e.message}`);
		lines.push("");
	}

	const activeRoute =
		report.meta.router.matches.at(-1)?.pathname ?? report.meta.url;
	lines.push("## Environment");
	lines.push(`- App URL: ${report.meta.url}`);
	lines.push(`- Active route: ${activeRoute}`);
	lines.push(`- User agent: ${report.meta.userAgent}`);
	lines.push(`- Viewport: ${report.meta.viewport}`);
	lines.push(`- Language: ${report.meta.language}`);
	lines.push("");

	lines.push(
		"Please help diagnose what caused this issue and suggest possible fixes.",
	);

	return lines.join("\n");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function BugReportViewer() {
	const { t } = useTranslation();
	const [report, setReport] = useState<Fabreport | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [storeExpanded, setStoreExpanded] = useState(false);
	const [galleryExpanded, setGalleryExpanded] = useState(false);
	const [restoringStore, setRestoringStore] = useState(false);
	const [restoringGallery, setRestoringGallery] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const loadFile = useCallback((file: File) => {
		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const parsed = JSON.parse(e.target?.result as string) as Fabreport;
				setReport(parsed);
				console.debug("loading stack remapping");
				const { remapStacks } = await import("../services/stack-remap");
				const remapped = await remapStacks(parsed);
				setReport(remapped);
			} catch {
				// Silently ignore invalid files — user will see no report loaded.
			}
		};
		reader.readAsText(file);
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) loadFile(file);
	};

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file) loadFile(file);
		},
		[loadFile],
	);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => setIsDragging(false);

	const reset = () => {
		setReport(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleRestoreStore = async () => {
		if (!report) return;
		setRestoringStore(true);
		try {
			await restoreStore(report.store);
		} finally {
			setRestoringStore(false);
		}
	};

	const handleRestoreGallery = async () => {
		if (!report) return;
		setRestoringGallery(true);
		try {
			await restoreGallery(report.gallery);
		} finally {
			setRestoringGallery(false);
		}
	};

	if (!report) {
		return (
			<div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
				<div className="w-full max-w-lg">
					<div className="mb-8 text-center">
						<div className="mb-4 flex justify-center">
							<div className="rounded-full border-2 border-border-primary bg-surface-muted p-4">
								<FileText className="h-8 w-8 text-heading" />
							</div>
						</div>
						<h1 className="text-3xl font-bold text-heading">
							{t("bug_report_viewer.title")}
						</h1>
						<p className="mt-2 text-muted">{t("bug_report_viewer.subtitle")}</p>
					</div>

					{/** biome-ignore lint/a11y/useKeyWithClickEvents: We don't need the key event for this div */}
					{/** biome-ignore lint/a11y/noStaticElementInteractions: it's okay if this is static */}
					<div
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onClick={() => fileInputRef.current?.click()}
						className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
							isDragging
								? "border-primary bg-primary/5"
								: "border-border-primary bg-surface hover:border-primary/50 hover:bg-surface-muted"
						}`}
					>
						<Upload className="mx-auto mb-4 h-10 w-10 text-muted" />
						<p className="text-lg font-medium text-body">
							{t("bug_report_viewer.upload_prompt")}
						</p>
						<p className="mt-1 text-sm text-subtle">
							{t("bug_report_viewer.upload_hint")}
						</p>
						<input
							ref={fileInputRef}
							type="file"
							accept=".fabreport"
							className="hidden"
							onChange={handleFileChange}
						/>
					</div>
				</div>
			</div>
		);
	}

	const errorCount = report.console.filter((e) => e.level === "error").length;
	const warnCount = report.console.filter((e) => e.level === "warn").length;

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="text-2xl font-bold text-heading">
							{t("bug_report_viewer.title")}
						</h1>
						<span className="rounded-full border border-border-primary bg-surface-muted px-3 py-0.5 font-mono text-xs text-muted">
							v{report.meta.appVersion}
						</span>
						{errorCount > 0 && (
							<span className="rounded-full bg-red-500/10 px-3 py-0.5 text-xs font-medium text-red-500">
								{errorCount} {t("bug_report_viewer.errors")}
							</span>
						)}
						{warnCount > 0 && (
							<span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-xs font-medium text-amber-500">
								{warnCount} {t("bug_report_viewer.warnings")}
							</span>
						)}
					</div>
					<div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-subtle">
						<span className="flex items-center gap-1.5">
							<Clock className="h-3.5 w-3.5" />
							{new Date(report.meta.timestamp).toLocaleString()}
						</span>
						<span className="flex items-center gap-1.5">
							<Globe className="h-3.5 w-3.5" />
							<span className="max-w-xs truncate font-mono text-xs">
								{report.meta.url}
							</span>
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<a
						href={`https://claude.ai/new?q=${encodeURIComponent(buildClaudePrompt(report))}`}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 rounded-lg border border-border-primary bg-orange-300 px-4 py-2 text-sm text-white transition-colors hover:bg-orange-400"
					>
						<MessageCircle className="h-4 w-4" />
						{t("bug_report_viewer.ask_claude")}
					</a>
					<button
						type="button"
						onClick={reset}
						className="flex items-center gap-2 rounded-lg border border-border-primary bg-surface px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-body"
					>
						<RefreshCw className="h-4 w-4" />
						{t("bug_report_viewer.load_another")}
					</button>
				</div>
			</div>

			<div className="space-y-6">
				{/* User Description */}
				<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
					<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
						<div className="flex items-center gap-3">
							<User className="h-5 w-5 text-heading" />
							<h2 className="text-xl font-semibold text-heading">
								{t("bug_report_viewer.section_user")}
							</h2>
						</div>
					</div>
					<div className="grid gap-4 p-6 sm:grid-cols-3">
						<UserField
							label={t("bug_report_viewer.what_broke")}
							value={report.user.whatBroke}
							emptyLabel={t("bug_report_viewer.not_provided")}
						/>
						<UserField
							label={t("bug_report_viewer.last_actions")}
							value={report.user.lastActions}
							emptyLabel={t("bug_report_viewer.not_provided")}
						/>
						<UserField
							label={t("bug_report_viewer.comments")}
							value={report.user.comments}
							emptyLabel={t("bug_report_viewer.not_provided")}
						/>
					</div>
				</div>

				{/* Console Logs */}
				<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
					<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Terminal className="h-5 w-5 text-heading" />
								<h2 className="text-xl font-semibold text-heading">
									{t("bug_report_viewer.section_console")}
								</h2>
							</div>
							<span className="text-sm text-subtle">
								{report.console.length} {t("bug_report_viewer.entries")}
							</span>
						</div>
					</div>
					<div className="max-h-96 overflow-y-auto p-4">
						{report.console.length === 0 ? (
							<p className="py-4 text-center text-sm text-subtle">
								{t("bug_report_viewer.console_empty")}
							</p>
						) : (
							<div className="space-y-2">
								{report.console.map((entry, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: console entries have no stable key
									<ConsoleLogEntry key={i} entry={entry} />
								))}
							</div>
						)}
					</div>
				</div>

				{/* Boundary Error */}
				{report.boundaryError && (
					<div className="rounded-lg border-2 border-red-500/40 bg-surface shadow-lg">
						<div className="border-b border-red-500/20 bg-red-500/5 px-6 py-4">
							<div className="flex items-center gap-3">
								<AlertTriangle className="h-5 w-5 text-red-500" />
								<h2 className="text-xl font-semibold text-heading">
									{t("bug_report_viewer.section_boundary_error")}
								</h2>
							</div>
						</div>
						<div className="flex flex-col gap-4 p-6">
							<div>
								<p className="mb-1 text-xs font-semibold uppercase tracking-wider text-subtle">
									{t("bug_report_viewer.boundary_error_message")}
								</p>
								<p className="font-mono text-sm text-body break-all">
									{report.boundaryError.message}
								</p>
							</div>
							{report.boundaryError.stack && (
								<div>
									<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
										{t("bug_report_viewer.stack_trace")}
									</p>
									<pre className="overflow-x-auto rounded-lg border border-border-primary bg-surface-muted p-4 font-mono text-xs text-body whitespace-pre-wrap">
										{report.boundaryError.stack}
									</pre>
								</div>
							)}
							{report.boundaryError.componentStack && (
								<details>
									<summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-subtle hover:text-muted">
										{t("bug_report_viewer.component_stack")}
									</summary>
									<pre className="mt-2 overflow-x-auto rounded-lg border border-border-primary bg-surface-muted p-4 font-mono text-xs text-subtle whitespace-pre-wrap">
										{report.boundaryError.componentStack}
									</pre>
								</details>
							)}
						</div>
					</div>
				)}

				{/* Environment */}
				<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
					<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
						<div className="flex items-center gap-3">
							<Layers className="h-5 w-5 text-heading" />
							<h2 className="text-xl font-semibold text-heading">
								{t("bug_report_viewer.section_environment")}
							</h2>
						</div>
					</div>
					<div className="p-6">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
							<MetaField
								label={t("bug_report_viewer.meta_user_agent")}
								value={report.meta.userAgent}
								mono
							/>
							<MetaField
								label={t("bug_report_viewer.meta_language")}
								value={report.meta.language}
							/>
							<MetaField
								label={t("bug_report_viewer.meta_screen")}
								value={report.meta.screenResolution}
							/>
							<MetaField
								label={t("bug_report_viewer.meta_viewport")}
								value={report.meta.viewport}
							/>
							<MetaField
								label={t("bug_report_viewer.meta_timezone")}
								value={report.meta.timezone}
							/>
						</div>
						{report.meta.router.matches.length > 0 && (
							<div className="mt-6">
								<h3 className="mb-3 text-sm font-semibold text-heading">
									{t("bug_report_viewer.meta_router_matches")}
								</h3>
								<div className="space-y-2">
									{report.meta.router.matches.map((match, i) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: router matches have no stable key
											key={i}
											className="rounded-md border border-border-primary bg-surface-muted px-4 py-3"
										>
											<div className="flex items-center gap-3">
												<span className="font-mono text-xs text-subtle">
													{match.id}
												</span>
												<span className="text-xs text-faint">→</span>
												<span className="font-mono text-sm text-body">
													{match.pathname}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Rendering */}
				{report.rendering !== undefined && (
					<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
						<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
							<div className="flex items-center gap-3">
								<Sliders className="h-5 w-5 text-heading" />
								<h2 className="text-xl font-semibold text-heading">
									{t("bug_report_viewer.section_rendering")}
								</h2>
							</div>
						</div>
						<div className="p-6">
							<div className="mb-4 flex flex-wrap items-center gap-3">
								<span className="text-xs font-semibold uppercase tracking-wider text-subtle">
									{t("bug_report_viewer.rendering_renderer_key")}
								</span>
								<code className="rounded border border-border-primary bg-surface-muted px-2 py-0.5 font-mono text-sm text-body">
									{report.rendering.cardBackRenderer ??
										t("bug_report_viewer.rendering_none")}
								</code>
								{report.rendering.resolvedConfig !== null ? (
									<span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-0.5 text-xs font-medium text-green-500">
										<CircleCheck className="h-3.5 w-3.5" />
										{t("bug_report_viewer.rendering_resolved")}
									</span>
								) : (
									<span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-0.5 text-xs font-medium text-red-500">
										<CircleAlert className="h-3.5 w-3.5" />
										{t("bug_report_viewer.rendering_unresolved")}
									</span>
								)}
							</div>
							{report.rendering.resolvedConfig !== null && (
								<pre className="max-h-64 overflow-auto rounded-lg border border-border-primary bg-surface-muted p-4 font-mono text-xs text-body">
									{JSON.stringify(report.rendering.resolvedConfig, null, 2)}
								</pre>
							)}
						</div>
					</div>
				)}

				{/* Screenshot */}
				<div className="rounded-lg border-2 border-border-primary bg-surface shadow-lg">
					<div className="border-b border-border-primary bg-surface-muted px-6 py-4">
						<div className="flex items-center gap-3">
							<Monitor className="h-5 w-5 text-heading" />
							<h2 className="text-xl font-semibold text-heading">
								{t("bug_report_viewer.section_screenshot")}
							</h2>
						</div>
					</div>
					<div className="p-6">
						{report.screenshot ? (
							<img
								src={report.screenshot}
								alt={t("bug_report_viewer.screenshot_alt")}
								className="w-full rounded-lg border border-border-primary"
							/>
						) : (
							<div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border-primary">
								<p className="text-sm text-subtle">
									{t("bug_report_viewer.screenshot_none")}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Store State */}
				<CollapsibleJsonSection
					title={t("bug_report_viewer.section_store")}
					icon={<Database className="h-5 w-5 text-heading" />}
					data={report.store}
					expanded={storeExpanded}
					onToggle={() => setStoreExpanded((v) => !v)}
					itemsLabel={t("bug_report_viewer.items")}
					action={
						<RestoreButton
							label={t("bug_report_viewer.restore_store")}
							loading={restoringStore}
							onClick={handleRestoreStore}
						/>
					}
				/>

				{/* Gallery */}
				<CollapsibleJsonSection
					title={t("bug_report_viewer.section_gallery")}
					icon={<Images className="h-5 w-5 text-heading" />}
					data={report.gallery}
					expanded={galleryExpanded}
					onToggle={() => setGalleryExpanded((v) => !v)}
					count={report.gallery.length}
					itemsLabel={t("bug_report_viewer.items")}
					action={
						<RestoreButton
							label={t("bug_report_viewer.restore_gallery")}
							loading={restoringGallery}
							onClick={handleRestoreGallery}
						/>
					}
				/>
			</div>
		</div>
	);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserField({
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

function MetaField({
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
};

function ConsoleLogEntry({ entry }: { entry: FabreportConsoleEntry }) {
	const { t } = useTranslation();
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

function RestoreButton({
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
			<RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
			{label}
		</button>
	);
}

function CollapsibleJsonSection({
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
