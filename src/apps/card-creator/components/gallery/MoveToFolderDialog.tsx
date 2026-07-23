import {
	computeAncestors,
	folderCrumbClassName,
} from "@fabkit/apps/card-creator/components/gallery/FolderBreadcrumbs";
import {
	moveCardToFolder,
	type StoredCard,
	type StoredFolder,
} from "@fabkit/apps/card-creator/persistence/card-storage";
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { ChevronRight, Folder } from "lucide-react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

interface MoveToFolderDialogProps {
	card: StoredCard;
	folders: StoredFolder[];
	onClose: () => void;
	onMoved: () => void;
}

/**
 * Breadcrumb-driven folder picker for moving a single card. Navigation here
 * is local component state, not a route change — it drives a modal picker,
 * not the page itself — so it's built with plain buttons rather than the
 * `Link`-based `FolderBreadcrumbs` used by the main gallery view.
 */
export function MoveToFolderDialog({
	card,
	folders,
	onClose,
	onMoved,
}: MoveToFolderDialogProps) {
	const { t } = useTranslation("card-creator");
	const [targetFolderId, setTargetFolderId] = useState<string | undefined>(
		card.folderId,
	);
	const [isMoving, setIsMoving] = useState(false);

	const ancestors = computeAncestors(folders, targetFolderId);
	const subfolders = folders.filter(
		(folder) => folder.parentId === targetFolderId,
	);
	const isAtCurrentLocation = targetFolderId === card.folderId;

	const handleMove = async () => {
		setIsMoving(true);
		try {
			await moveCardToFolder(card.version, targetFolderId);
			onMoved();
		} catch (error) {
			console.error("Failed to move card:", error);
			alert(t("gallery.folders.move_error"));
		} finally {
			setIsMoving(false);
		}
	};

	return (
		<Dialog open onClose={onClose} className="relative z-50">
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="w-full max-w-md space-y-4 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<DialogTitle className="text-lg font-bold text-heading">
						{t("gallery.folders.move_dialog_title", { name: card.cardName })}
					</DialogTitle>

					<nav
						aria-label={t("gallery.folders.breadcrumbs_label")}
						className="flex flex-wrap items-center gap-1 text-sm"
					>
						<button
							type="button"
							onClick={() => setTargetFolderId(undefined)}
							className={folderCrumbClassName(targetFolderId === undefined)}
						>
							{t("gallery.folders.root")}
						</button>
						{ancestors.map((folder) => (
							<Fragment key={folder.id}>
								<ChevronRight className="h-4 w-4 text-subtle" />
								<button
									type="button"
									onClick={() => setTargetFolderId(folder.id)}
									className={folderCrumbClassName(folder.id === targetFolderId)}
								>
									{folder.name}
								</button>
							</Fragment>
						))}
					</nav>

					<div className="max-h-64 space-y-1 overflow-y-auto">
						{subfolders.length === 0 ? (
							<p className="py-6 text-center text-sm text-subtle">
								{t("gallery.folders.no_subfolders")}
							</p>
						) : (
							subfolders.map((folder) => (
								<button
									key={folder.id}
									type="button"
									onClick={() => setTargetFolderId(folder.id)}
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-body transition-colors hover:bg-surface-muted"
								>
									<Folder className="h-4 w-4 shrink-0 text-heading" />
									<span className="truncate">{folder.name}</span>
								</button>
							))
						)}
					</div>

					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
						>
							{t("gallery.folders.cancel")}
						</button>
						<button
							type="button"
							onClick={handleMove}
							disabled={isMoving || isAtCurrentLocation}
							className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{t("gallery.folders.move_here")}
						</button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
