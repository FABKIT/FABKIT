import Bold from "@tiptap/extension-bold";
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Emoji, type EmojiItem } from "./extensions/Emoji.ts";
import { FabDash } from "./extensions/FabDash.ts";

/**
 * The editor's extension set, shared with anything that has to produce the
 * same HTML without an editor instance (generateHTML from @tiptap/core takes
 * this array). Keeping it in one place is what makes generated HTML and
 * editor-typed HTML the same string for the same document.
 */
export const getRichTextExtensions = (
	customEmojis: EmojiItem[],
): Extensions => [
	StarterKit.configure({
		bold: false,
		listItem: false,
		orderedList: false,
		bulletList: false,
	}),
	Bold,
	Underline,
	ListItem,
	BulletList.configure({
		HTMLAttributes: {
			class: "list-disc ml-2",
		},
	}),
	OrderedList.configure({
		HTMLAttributes: {
			class: "list-decimal ml-2",
		},
	}),
	TextAlign.configure({
		types: ["heading", "paragraph"],
	}),
	Emoji.configure({
		HTMLAttributes: {
			class: "fab-icon",
		},
		emojis: customEmojis,
	}),
	FabDash,
];
