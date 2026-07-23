import type { StoredFolder } from "@fabkit/apps/card-creator/persistence/card-storage";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link } from "@tanstack/react-router";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FolderTileProps {
	folder: StoredFolder;
	onRequestRename: (folder: StoredFolder) => void;
	onRequestDelete: (folder: StoredFolder) => void;
}

export function FolderTile({
	folder,
	onRequestRename,
	onRequestDelete,
}: FolderTileProps) {
	const { t } = useTranslation("card-creator");

	return (
		<div className="flex items-center gap-2 rounded-lg border border-border-primary bg-surface p-4 transition-colors hover:bg-surface-muted">
			<Link
				to="/gallery"
				search={{ folderId: folder.id }}
				className="flex min-w-0 flex-1 items-center gap-3"
			>
				<Folder className="h-6 w-6 shrink-0 text-heading" />
				<span className="truncate font-medium text-heading" title={folder.name}>
					{folder.name}
				</span>
			</Link>
			<Menu as="div" className="relative shrink-0">
				<MenuButton
					aria-label={t("gallery.folders.actions")}
					className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-active hover:text-heading"
				>
					<MoreVertical className="h-4 w-4" />
				</MenuButton>
				<MenuItems
					anchor="bottom end"
					className="mt-2 w-40 origin-top-right rounded-lg bg-surface shadow-lg ring-1 ring-border-primary focus:outline-none"
				>
					<div className="py-1">
						<MenuItem>
							{({ focus }) => (
								<button
									type="button"
									onClick={() => onRequestRename(folder)}
									className={`${
										focus ? "bg-surface-active" : ""
									} flex w-full items-center gap-2 px-3 py-2 text-sm text-body`}
								>
									<Pencil className="h-4 w-4" />
									{t("gallery.folders.rename")}
								</button>
							)}
						</MenuItem>
						<MenuItem>
							{({ focus }) => (
								<button
									type="button"
									onClick={() => onRequestDelete(folder)}
									className={`${
										focus ? "bg-surface-active" : ""
									} flex w-full items-center gap-2 px-3 py-2 text-sm text-body`}
								>
									<Trash2 className="h-4 w-4" />
									{t("gallery.folders.delete")}
								</button>
							)}
						</MenuItem>
					</div>
				</MenuItems>
			</Menu>
		</div>
	);
}
