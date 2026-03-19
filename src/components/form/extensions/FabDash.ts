import { mergeAttributes, Node } from "@tiptap/core";

/**
 * Custom inline Tiptap node that renders a horizontal bar matching the
 * dash used on real Flesh and Blood cards (between keyword and cost icons).
 *
 * Rendered as <span class="fab-dash"></span> in HTML output so it survives
 * round-trips through the card store and is styled via CSS in both the
 * editor and the card foreignObject renderer.
 */
export const FabDash = Node.create({
	name: "fabDash",

	group: "inline",
	inline: true,
	atom: true, // treated as a single un-editable unit, like emoji

	parseHTML() {
		return [{ tag: "span.fab-dash" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["span", mergeAttributes(HTMLAttributes, { class: "fab-dash" })];
	},
});
