/**
 * Restricted-Markup Preset-Link Text Parser
 *
 * CardText arriving via a preset link (see preset-link/preset-link.ts) is
 * plain, UNTRUSTED text from a third party — never the live Tiptap editor's
 * own HTML output. This module is the only place that turns that string
 * into the Tiptap `Content` JSON used both to hydrate the editor
 * (CardTextNode) and to render the actual card face (CardTextHTML), which
 * NormalRenderer/MeldRenderer feed straight into `dangerouslySetInnerHTML`.
 *
 * The restricted-markup *parsing* below (paragraphs, `**bold**`,
 * `__underline__`, `:shortcode:`) is bespoke — Tiptap has no notion of this
 * syntax, so there's nothing to delegate to. But turning the resulting
 * `Content` into HTML is exactly what Tiptap's own `generateHTML` already
 * does, using the *same* Bold/Underline/Emoji extensions the live editor
 * renders with (RichTextEditor.tsx) — so CardTextHTML is guaranteed
 * byte-for-byte identical to what the live editor would produce for
 * equivalent content, including HTML-escaping (handled by Tiptap's DOM
 * serializer, not a hand-rolled escapeHtml()). Hand-rolling that step
 * instead would silently drift from the real editor's rendering the next
 * time an extension's `renderHTML` changes — e.g. the custom Emoji node's
 * `<span>`/`<img>` markup (extensions/Emoji.ts).
 *
 * `generateHTML` needs a `document` global, which Bun's DOM-less test
 * runtime doesn't have — resolved by importing from `@tiptap/html` instead
 * of `@tiptap/core`: its `node` export condition swaps in a headless
 * happy-dom implementation automatically (see its package.json `exports`),
 * while Vite's browser build resolves the `browser` condition and uses the
 * real DOM, so nothing here needs environment-specific code or a manual
 * jsdom/happy-dom setup step. See tests/preset-text.test.ts.
 *
 * Supported syntax, deliberately small:
 *   - blank-line-separated paragraphs, single `\n` within a paragraph as a
 *     hard line break
 *   - `**bold**`
 *   - `__underline__`
 *   - `:shortcode:` — resolved against the same EditorCustomEmojiRows list
 *     the live editor's `:shortcode:` input rule uses (config/editor.ts),
 *     so a preset link's icons match what a user could type by hand.
 * Anything else (unmatched `**`/`__`, unknown shortcode) is left as literal
 * text — this parser never throws, matching the preset-link feature's
 * best-effort error handling.
 */

import { Emoji } from "@fabkit/platform/components/form/extensions/Emoji.ts";
import { Bold } from "@tiptap/extension-bold";
import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { Underline } from "@tiptap/extension-underline";
import { generateHTML } from "@tiptap/html";
import type { Content } from "@tiptap/react";
import { EditorCustomEmojiRows } from "../config/editor.ts";

const knownEmojis = EditorCustomEmojiRows.flat();

const HTML_EXTENSIONS = [
	Document,
	Paragraph,
	Text,
	Bold,
	Underline,
	HardBreak,
	Emoji.configure({
		HTMLAttributes: { class: "fab-icon" },
		emojis: knownEmojis,
	}),
];

function findEmojiName(shortcode: string): string | null {
	const item = knownEmojis.find(
		(emoji) => emoji.name === shortcode || emoji.shortcodes.includes(shortcode),
	);
	return item?.name ?? null;
}

type InlineNode =
	| { type: "text"; text: string; marks?: { type: string }[] }
	| { type: "emoji"; attrs: { name: string } }
	| { type: "hardBreak" };

const TOKEN_RE = /\*\*(.+?)\*\*|__(.+?)__|:([a-zA-Z0-9_+-]+):/g;

function parseLine(line: string): InlineNode[] {
	const nodes: InlineNode[] = [];
	let lastIndex = 0;
	for (const match of line.matchAll(TOKEN_RE)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			nodes.push({ type: "text", text: line.slice(lastIndex, index) });
		}
		const [full, bold, underline, shortcode] = match;
		if (bold !== undefined) {
			nodes.push({ type: "text", text: bold, marks: [{ type: "bold" }] });
		} else if (underline !== undefined) {
			nodes.push({
				type: "text",
				text: underline,
				marks: [{ type: "underline" }],
			});
		} else if (shortcode !== undefined) {
			const name = findEmojiName(shortcode);
			nodes.push(
				name
					? { type: "emoji", attrs: { name } }
					: { type: "text", text: full },
			);
		}
		lastIndex = index + full.length;
	}
	if (lastIndex < line.length) {
		nodes.push({ type: "text", text: line.slice(lastIndex) });
	}
	return nodes;
}

/**
 * Parses restricted markup into both the Tiptap `Content` used to hydrate
 * the rich-text editor and the HTML string the SVG renderer actually
 * displays. Never throws — unrecognised syntax degrades to literal text.
 */
export function parsePresetText(markup: string): {
	html: string;
	content: Content;
} {
	const paragraphs = markup.split(/\n\s*\n/);
	const paragraphNodes = paragraphs.map((paragraph) => {
		const lines = paragraph.split("\n");
		const inline: InlineNode[] = [];
		lines.forEach((line, i) => {
			if (i > 0) inline.push({ type: "hardBreak" });
			inline.push(...parseLine(line));
		});
		const nonEmpty = inline.filter(
			(node) => node.type !== "text" || node.text.length > 0,
		);
		return {
			type: "paragraph" as const,
			content: nonEmpty.length > 0 ? nonEmpty : undefined,
		};
	});

	const doc = { type: "doc" as const, content: paragraphNodes };
	const html = generateHTML(doc, HTML_EXTENSIONS);

	return { html, content: doc as Content };
}
