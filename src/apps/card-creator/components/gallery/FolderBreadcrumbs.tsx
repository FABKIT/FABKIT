import type { StoredFolder } from "@fabkit/apps/card-creator/persistence/card-storage";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

interface FolderBreadcrumbsProps {
	folders: StoredFolder[];
	currentFolderId?: string;
}

/**
 * Walks the flat folder list from `folderId` up to the root, using the folder
 * list already loaded by the gallery route loader instead of hitting the
 * storage layer's async `getAncestors` again. Dangling/unresolved `parentId`
 * links terminate the walk early, matching `getAncestors`'s "treat as root"
 * behaviour.
 */
export function computeAncestors(
	folders: StoredFolder[],
	folderId: string | undefined,
): StoredFolder[] {
	if (!folderId) return [];
	const byId = new Map(folders.map((folder) => [folder.id, folder]));
	const chain: StoredFolder[] = [];
	const visited = new Set<string>();
	let currentId: string | undefined = folderId;
	while (currentId && !visited.has(currentId)) {
		visited.add(currentId);
		const folder = byId.get(currentId);
		if (!folder) break;
		chain.unshift(folder);
		currentId = folder.parentId;
	}
	return chain;
}

export function folderCrumbClassName(active: boolean): string {
	return active
		? "font-semibold text-heading"
		: "text-muted transition-colors hover:text-heading";
}

export function FolderBreadcrumbs({
	folders,
	currentFolderId,
}: FolderBreadcrumbsProps) {
	const { t } = useTranslation("card-creator");
	const ancestors = computeAncestors(folders, currentFolderId);

	return (
		<nav
			aria-label={t("gallery.folders.breadcrumbs_label")}
			className="flex flex-wrap items-center gap-1 text-sm"
		>
			<Link
				to="/gallery"
				search={{}}
				className={folderCrumbClassName(currentFolderId === undefined)}
			>
				{t("gallery.folders.root")}
			</Link>
			{ancestors.map((folder) => (
				<Fragment key={folder.id}>
					<ChevronRight className="h-4 w-4 text-subtle" />
					<Link
						to="/gallery"
						search={{ folderId: folder.id }}
						className={folderCrumbClassName(folder.id === currentFolderId)}
					>
						{folder.name}
					</Link>
				</Fragment>
			))}
		</nav>
	);
}
