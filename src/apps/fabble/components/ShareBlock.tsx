import { ShareCard } from "@fabkit/apps/fabble/components/ShareCard";
import type { FabbleMode } from "@fabkit/apps/fabble/config";
import {
	MAX_GUESSES,
	SHARE_LINK,
	USERNAME_MAX_LENGTH,
} from "@fabkit/apps/fabble/config";
import { shareDateLabel } from "@fabkit/apps/fabble/game/date";
import { buildShareText } from "@fabkit/apps/fabble/game/share-text";
import { useToast } from "@fabkit/apps/fabble/hooks/useToast";
import {
	getOrderedResults,
	type ModeSession,
	useFabbleStore,
} from "@fabkit/apps/fabble/stores/fabble";
import { snapdom } from "@zumer/snapdom";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface ShareBlockProps {
	mode: FabbleMode;
	session: ModeSession;
	today: Date;
}

function buildFileName(username: string, dateLabel: string): string {
	const safeName = (username || "fabble").replace(/[^a-z0-9_-]/gi, "");
	return `${safeName}_fabble-result_${dateLabel}.png`;
}

async function captureNodeBlob(node: HTMLElement): Promise<Blob> {
	const capture = await snapdom(node, { scale: 2, embedFonts: true });
	return capture.toBlob({ type: "png" });
}

function downloadBlob(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

export function ShareBlock({ mode, session, today }: ShareBlockProps) {
	const { t } = useTranslation("fabble");
	const username = useFabbleStore((s) => s.username);
	const setUsername = useFabbleStore((s) => s.setUsername);
	const [usernameInput, setUsernameInput] = useState(username);
	const [capturing, setCapturing] = useState(false);
	const { toast, showToast } = useToast();
	const cardRef = useRef<HTMLDivElement>(null);

	const won = session.status === "won";
	const rows = getOrderedResults(session);
	const maxGuesses = MAX_GUESSES[mode];
	const hintsUsed = session.hintsRevealed.filter(Boolean).length;
	const modeBadgeLabel = t(`play.mode_badge_${mode}`);
	const modeName = t(`home.modes.${mode}.name`);
	const dateLabel = shareDateLabel(today);

	const fileName = buildFileName(username, dateLabel);

	async function captureCardBlob(): Promise<Blob | null> {
		setCapturing(true);
		await new Promise((r) => requestAnimationFrame(r));
		await new Promise((r) => requestAnimationFrame(r));

		try {
			const node = cardRef.current;
			if (!node) return null;
			return await captureNodeBlob(node);
		} finally {
			setCapturing(false);
		}
	}

	async function handleShare() {
		const blob = await captureCardBlob();
		if (!blob) return;
		const file = new File([blob], fileName, { type: "image/png" });

		if (!navigator.canShare?.({ files: [file] })) {
			showToast(t("share.unsupported"));
			return;
		}
		try {
			await navigator.share({ files: [file], title: "Fabble" });
		} catch (error) {
			// AbortError means the user dismissed the share sheet — not a failure.
			if (error instanceof Error && error.name === "AbortError") return;
			console.error("Fabble: share failed", error);
			showToast(t("share.failed"));
		}
	}

	async function handleExport() {
		const blob = await captureCardBlob();
		if (!blob) return;
		downloadBlob(blob, fileName);
		showToast(t("share.exported"));
	}

	async function handleCopyText() {
		const text = buildShareText({
			username,
			modeLabel: modeName,
			dateLabel,
			won,
			guessCount: session.guesses.length,
			maxGuesses,
			hintsUsed,
			rows: rows.map((row) => row.columns.map((column) => column.state)),
			link: SHARE_LINK,
		});
		await navigator.clipboard.writeText(text);
		showToast(t("share.copied"));
	}

	return (
		<div className="flex w-full max-w-140 flex-col items-center gap-3">
			<div className="flex w-full flex-col items-center gap-1">
				<label htmlFor="fabble-username" className="text-xs text-muted">
					{t("share.username_label")}
				</label>
				<input
					id="fabble-username"
					type="text"
					value={usernameInput}
					maxLength={USERNAME_MAX_LENGTH}
					onChange={(e) => setUsernameInput(e.target.value)}
					onBlur={() => setUsername(usernameInput)}
					className="w-full max-w-60 rounded-md border border-border-primary bg-surface px-3 py-1.5 text-center text-sm text-body focus:border-primary focus:outline-none"
				/>
				<span className="text-xs text-faint">{t("share.username_hint")}</span>
			</div>

			<div className="flex flex-wrap justify-center gap-2">
				<button
					type="button"
					onClick={handleShare}
					disabled={capturing}
					className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{t("share.button")}
				</button>
				<button
					type="button"
					onClick={handleExport}
					disabled={capturing}
					className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{t("share.export")}
				</button>
				<button
					type="button"
					onClick={handleCopyText}
					className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
				>
					{t("share.copy_text")}
				</button>
			</div>

			{toast && <span className="text-xs text-muted">{toast}</span>}

			{capturing && (
				<ShareCard
					ref={cardRef}
					modeLabel={modeBadgeLabel}
					dateLabel={dateLabel}
					username={username}
					won={won}
					guessCount={session.guesses.length}
					maxGuesses={maxGuesses}
					hintsUsed={hintsUsed}
					rows={rows}
				/>
			)}
		</div>
	);
}
