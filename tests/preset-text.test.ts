import { describe, expect, it } from "bun:test";
import { parsePresetText } from "../src/apps/card-creator/utils/preset-text.ts";

describe("parsePresetText", () => {
	it("parses a plain single-paragraph string", () => {
		const { html, content } = parsePresetText("Deal 3 damage.");
		expect(html).toBe("<p>Deal 3 damage.</p>");
		expect(content).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "Deal 3 damage." }],
				},
			],
		});
	});

	it("splits blank-line-separated text into separate paragraphs", () => {
		const { html, content } = parsePresetText("First.\n\nSecond.");
		expect(html).toBe("<p>First.</p><p>Second.</p>");
		expect((content as { content: unknown[] }).content).toHaveLength(2);
	});

	it("turns a single newline within a paragraph into a hard break", () => {
		const { html, content } = parsePresetText("Line one.\nLine two.");
		expect(html).toBe("<p>Line one.<br>Line two.</p>");
		const doc = content as {
			content: { content: { type: string }[] }[];
		};
		expect(doc.content[0].content.map((n) => n.type)).toEqual([
			"text",
			"hardBreak",
			"text",
		]);
	});

	it("applies bold to **marked** text", () => {
		const { html, content } = parsePresetText("Gets **Dominate**.");
		expect(html).toBe("<p>Gets <strong>Dominate</strong>.</p>");
		const doc = content as {
			content: { content: { type: string; marks?: { type: string }[] }[] }[];
		};
		const boldNode = doc.content[0].content.find(
			(n) => n.marks?.[0]?.type === "bold",
		);
		expect(boldNode).toBeDefined();
	});

	it("applies underline to __marked__ text", () => {
		const { html } = parsePresetText("__Go again.__");
		expect(html).toBe("<p><u>Go again.</u></p>");
	});

	it("resolves a known :shortcode: to an emoji node with its fallback image", () => {
		const { html, content } = parsePresetText("Pay :power: to activate.");
		// Attribute order comes from the same Emoji extension the live editor
		// renders with (extensions/Emoji.ts) — checked independently rather
		// than as one exact tag string, so this doesn't pin an incidental
		// serializer ordering detail.
		expect(html).toContain('class="fab-icon"');
		expect(html).toContain('data-type="emoji"');
		expect(html).toContain('data-name="power"');
		expect(html).toContain('src="/img/symbols/icon_pwr.svg"');
		const doc = content as {
			content: { content: { type: string; attrs?: { name: string } }[] }[];
		};
		const emojiNode = doc.content[0].content.find((n) => n.type === "emoji");
		expect(emojiNode?.attrs?.name).toBe("power");
	});

	it("leaves an unrecognized :shortcode: as literal text instead of throwing", () => {
		const { html } = parsePresetText("Cast :not-a-real-icon:.");
		expect(html).toBe("<p>Cast :not-a-real-icon:.</p>");
	});

	it("leaves unmatched ** and __ as literal text instead of throwing", () => {
		const { html } = parsePresetText("This has ** an unmatched marker.");
		expect(html).toBe("<p>This has ** an unmatched marker.</p>");
	});

	it("HTML-escapes literal text so a hostile payload can't inject markup", () => {
		const { html } = parsePresetText('<img src=x onerror="alert(1)">');
		expect(html).not.toContain("<img src=x");
		// `<`/`>`/`&` are escaped — the only characters that matter in text-node
		// position; a bare `"` can't break out of an attribute it isn't inside.
		expect(html).toBe('<p>&lt;img src=x onerror="alert(1)"&gt;</p>');
	});

	it("escapes text carried inside bold/underline marks too", () => {
		const { html } = parsePresetText("**<script>alert(1)</script>**");
		expect(html).not.toContain("<script>");
		expect(html).toBe(
			"<p><strong>&lt;script&gt;alert(1)&lt;/script&gt;</strong></p>",
		);
	});

	it("produces a single empty paragraph for an empty string, matching the editor's own empty-doc shape", () => {
		const { html, content } = parsePresetText("");
		expect(html).toBe("<p></p>");
		expect(content).toEqual({
			type: "doc",
			content: [{ type: "paragraph", content: undefined }],
		});
	});
});
