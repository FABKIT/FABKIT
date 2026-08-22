/**
 * Converts a prefill link's plain text into the two representations the store
 * keeps: the Tiptap document the editor hydrates from, and the HTML the
 * renderers put through dangerouslySetInnerHTML.
 *
 * A link never supplies HTML. See
 * docs/adr/0002-prefill-link-text-is-plain-text.md for why that surface stays
 * closed, and why the HTML is generated from the document rather than written
 * by hand.
 */

import { getRichTextExtensions } from "@fabkit/platform/components/form/rich-text-extensions.ts";
import { generateHTML, type JSONContent } from "@tiptap/core";
import { EditorCustomEmojiRows } from "../config/editor.ts";

/**
 * Same shape the editor's own input rule recognises, so the shortcodes a link
 * author writes are the ones a user gets by typing.
 */
const ShortcodePattern = /:([a-zA-Z0-9_+-]+):/g;

/**
 * Bold shorthand, the same pattern @tiptap/extension-bold applies as you
 * type: its `starInputRegex` and `underscoreInputRegex`, which take the same
 * two delimiters, require the opening one to start the line or follow a
 * space (so an underscore inside a word is left alone), and match a run
 * containing no further delimiter. A link author and a user at the keyboard
 * therefore produce the same document.
 *
 * Two differences follow from scanning a finished string rather than matching
 * at a caret, and neither changes what counts as bold: the trailing `$` is
 * dropped, and so is tiptap's guard after the closing delimiter, which exists
 * to stop a rule firing mid-keystroke and in a scan would reject the first of
 * two bold runs on one line.
 *
 * The guards are lookaheads, never lookbehinds: the build targets Safari 16,
 * which cannot parse a lookbehind, and a regex literal it cannot parse takes
 * the whole chunk down with it rather than just this feature.
 *
 * This is shorthand the parser interprets, not markup it passes through. The
 * document is still built here and the HTML still generated from it, so the
 * rule that a link can never supply HTML is untouched.
 */
const BoldPattern =
	/(^|\s)(?:\*\*(?!\s+\*\*)([^*]+)\*\*|__(?!\s+__)([^_]+)__)/g;

const CardEmojis = EditorCustomEmojiRows.flat();

const getEmojiName = (shortcode: string): string | undefined =>
	CardEmojis.find(
		(emoji) => emoji.name === shortcode || emoji.shortcodes.includes(shortcode),
	)?.name;

/**
 * Splits a run of text into text and emoji nodes, carrying the run's marks
 * onto the text. An unrecognised shortcode is left in the surrounding text,
 * which is exactly what the editor does with one. Marks stay off the emoji
 * nodes: bolding an icon means nothing, and ProseMirror is happy either way.
 */
const getRunContent = (run: string, isBold: boolean): JSONContent[] => {
	const content: JSONContent[] = [];
	let consumed = 0;

	// A fresh array per node rather than one shared by the whole run:
	// CardTextNode is held in the store, persisted to IndexedDB, and written
	// into a .fabkit export verbatim, so nodes must not alias one mutable array.
	const getMarks = (): JSONContent["marks"] =>
		isBold ? [{ type: "bold" }] : undefined;

	for (const match of run.matchAll(ShortcodePattern)) {
		const name = getEmojiName(match[1]);

		if (name !== undefined) {
			const literal = run.slice(consumed, match.index);

			if (literal !== "") {
				content.push({ type: "text", text: literal, marks: getMarks() });
			}
			content.push({ type: "emoji", attrs: { name } });
			consumed = match.index + match[0].length;
		}
	}

	const remainder = run.slice(consumed);
	if (remainder !== "") {
		content.push({ type: "text", text: remainder, marks: getMarks() });
	}

	return content;
};

/** Splits one line into bold and unbold runs, then each run into nodes. */
const getLineContent = (line: string): JSONContent[] => {
	const content: JSONContent[] = [];
	let consumed = 0;

	for (const match of line.matchAll(BoldPattern)) {
		const [matched, leading, starred, underscored] = match;
		// Exactly one of the two delimiter alternatives captured.
		const bolded = starred ?? underscored;

		// The space the pattern needs before the opening delimiter belongs to
		// the text in front of it, not to the bold run.
		content.push(
			...getRunContent(line.slice(consumed, match.index) + leading, false),
		);
		content.push(...getRunContent(bolded, true));
		consumed = match.index + matched.length;
	}

	content.push(...getRunContent(line.slice(consumed), false));

	return content;
};

export const getCardTextDoc = (text: string): JSONContent => ({
	type: "doc",
	content: text.split(/\r?\n/).map((line) => {
		const content = getLineContent(line);
		// A paragraph with an empty content array is not a valid document node,
		// so a blank line is a paragraph with no content property at all.
		return content.length > 0
			? { type: "paragraph", content }
			: { type: "paragraph" };
	}),
});

/**
 * Needs a DOM (ProseMirror serialises through the global document), so this
 * belongs to the browser-side apply step, not to parse.ts.
 */
export const getCardTextHTML = (doc: JSONContent): string =>
	generateHTML(doc, getRichTextExtensions(CardEmojis));
