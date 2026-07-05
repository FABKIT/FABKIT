import { InputRule, mergeAttributes, Node, PasteRule } from "@tiptap/core";

/**
 * Minimal stand-in for @tiptap/extension-emoji, kept local so we don't bundle
 * its ~650KB default unicode emoji dataset — FABKIT only ever renders its own
 * custom fallback-image icons (cost, power, etc.) and never the default set.
 */

export interface EmojiItem {
	name: string;
	shortcodes: string[];
	tags: string[];
	group: string;
	fallbackImage?: string;
}

export interface EmojiOptions {
	HTMLAttributes: Record<string, unknown>;
	emojis: EmojiItem[];
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		emoji: {
			setEmoji: (shortcode: string) => ReturnType;
		};
	}
}

const inputRegex = /:([a-zA-Z0-9_+-]+):$/;
const pasteRegex = /(^|\s):([a-zA-Z0-9_+-]+):/g;

function findEmoji(name: string, emojis: EmojiItem[]): EmojiItem | undefined {
	return emojis.find(
		(item) => name === item.name || item.shortcodes.includes(name),
	);
}

export const Emoji = Node.create<EmojiOptions>({
	name: "emoji",

	inline: true,
	group: "inline",
	selectable: false,

	addOptions() {
		return {
			HTMLAttributes: {},
			emojis: [],
		};
	},

	addAttributes() {
		return {
			name: {
				default: null,
				parseHTML: (element) => element.dataset.name,
				renderHTML: (attributes) => ({
					"data-name": attributes.name,
				}),
			},
		};
	},

	parseHTML() {
		return [{ tag: `span[data-type="${this.name}"]` }];
	},

	renderHTML({ HTMLAttributes, node }) {
		const emojiItem = findEmoji(node.attrs.name, this.options.emojis);
		const attributes = mergeAttributes(
			HTMLAttributes,
			this.options.HTMLAttributes,
			{ "data-type": this.name },
		);

		if (!emojiItem?.fallbackImage) {
			return ["span", attributes, `:${node.attrs.name}:`];
		}

		return [
			"span",
			attributes,
			[
				"img",
				{
					src: emojiItem.fallbackImage,
					draggable: "false",
					loading: "lazy",
					align: "absmiddle",
					alt: `${emojiItem.name} emoji`,
				},
			],
		];
	},

	renderText({ node }) {
		return `:${node.attrs.name}:`;
	},

	addCommands() {
		return {
			setEmoji:
				(shortcode) =>
				({ chain }) => {
					const emojiItem = findEmoji(shortcode, this.options.emojis);

					if (!emojiItem) {
						return false;
					}

					return chain()
						.insertContent({
							type: this.name,
							attrs: { name: emojiItem.name },
						})
						.command(({ tr, state }) => {
							tr.setStoredMarks(
								state.doc.resolve(state.selection.to - 1).marks(),
							);
							return true;
						})
						.run();
				},
		};
	},

	addInputRules() {
		return [
			new InputRule({
				find: inputRegex,
				handler: ({ range, match, chain }) => {
					const name = match[1];

					if (!findEmoji(name, this.options.emojis)) {
						return;
					}

					chain()
						.insertContentAt(range, { type: this.name, attrs: { name } })
						.command(({ tr, state }) => {
							tr.setStoredMarks(
								state.doc.resolve(state.selection.to - 1).marks(),
							);
							return true;
						})
						.run();
				},
			}),
		];
	},

	addPasteRules() {
		return [
			new PasteRule({
				find: pasteRegex,
				handler: ({ range, match, chain }) => {
					const prefix = match[1] || "";
					const name = match[2];

					if (!findEmoji(name, this.options.emojis)) {
						return;
					}

					const shortcodeFrom = range.from + prefix.length;
					const shortcodeTo = range.to;

					chain()
						.insertContentAt(
							{ from: shortcodeFrom, to: shortcodeTo },
							{ type: this.name, attrs: { name } },
							{ updateSelection: false },
						)
						.command(({ tr, state }) => {
							tr.setStoredMarks(
								state.doc.resolve(state.selection.to - 1).marks(),
							);
							return true;
						})
						.run();
				},
			}),
		];
	},
});
