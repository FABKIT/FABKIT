import Bold from "@tiptap/extension-bold";
import Emoji from "@tiptap/extension-emoji";
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { type Content, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	AlignCenter as AlignCenterIcon,
	AlignLeft as AlignLeftIcon,
	Bold as BoldIcon,
	Italic as ItalicIcon,
	List as ListBulletIcon,
	ListOrdered as NumberedListIcon,
	Underline as UnderlineIcon,
} from "lucide-react";
import { EditorCustomEmojiRows } from "../../config/editor.ts";
import { FabDash } from "./extensions/FabDash.ts";
import "../../styles/components/rich-text-editor.css";

const customEmojisRow1 = EditorCustomEmojiRows[0];
const customEmojisRow2 = EditorCustomEmojiRows[1];

export interface RichTextEditorProps {
	content: Content | null;
	onChange?: (html: string, content: Content) => void;
}

export default function RichTextEditor({
	content,
	onChange,
}: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
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
				emojis: [...customEmojisRow1, ...customEmojisRow2],
			}),
			FabDash,
		],
		content: content,
		onUpdate: ({ editor }) => {
			if (onChange) {
				onChange(editor.getHTML(), editor.getJSON());
			}
		},
		editorProps: {
			attributes: {
				class:
					"prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-3 focus:outline-none min-h-32 cursor-text",
			},
		},
	});

	if (!editor) {
		return <p>Editor failed to load...</p>;
	}

	return (
		<div className="border rounded-lg p-3 border-border bg-surface shadow-sm">
			<div className="flex flex-wrap gap-2">
				{/* Text Formatting */}
				<div className="inline-flex rounded-lg bg-surface-muted p-1">
					<button
						type="button"
						onClick={() => editor.chain().focus().toggleBold().run()}
						className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
							editor.isActive("bold")
								? "bg-primary text-white shadow-md"
								: "text-body hover:bg-primary/10"
						}`}
					>
						<span className="sr-only">Toggle Bold</span>
						<BoldIcon aria-hidden="true" className="size-4" />
					</button>
					<button
						type="button"
						onClick={() => editor.chain().focus().toggleItalic().run()}
						className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
							editor.isActive("italic")
								? "bg-primary text-white shadow-md"
								: "text-body hover:bg-primary/10"
						}`}
					>
						<span className="sr-only">Toggle Italic</span>
						<ItalicIcon aria-hidden="true" className="size-4" />
					</button>
					<button
						type="button"
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
							editor.isActive("underline")
								? "bg-primary text-white shadow-md"
								: "text-body hover:bg-primary/10"
						}`}
					>
						<span className="sr-only">Toggle Underline</span>
						<UnderlineIcon aria-hidden="true" className="size-4" />
					</button>
				</div>

				{/* Lists */}
				<div className="inline-flex rounded-lg bg-surface-muted p-1">
					<button
						type="button"
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
							editor.isActive("bulletList")
								? "bg-primary text-white shadow-md"
								: "text-body hover:bg-primary/10"
						}`}
					>
						<span className="sr-only">Toggle bullet list</span>
						<ListBulletIcon aria-hidden="true" className="size-4" />
					</button>
					<button
						type="button"
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
							editor.isActive("orderedList")
								? "bg-primary text-white shadow-md"
								: "text-body hover:bg-primary/10"
						}`}
					>
						<span className="sr-only">Toggle ordered list</span>
						<NumberedListIcon aria-hidden="true" className="size-4" />
					</button>
				</div>

				{/* Text Alignment */}
				<div className="inline-flex rounded-lg bg-surface-muted p-1">
					<button
						type="button"
						onClick={() => editor.chain().focus().setTextAlign("left").run()}
						className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
							editor.isActive({ textAlign: "left" })
								? "bg-primary text-white shadow-md"
								: "text-body hover:bg-primary/10"
						}`}
					>
						<span className="sr-only">Left</span>
						<AlignLeftIcon aria-hidden="true" className="size-4" />
					</button>
					<button
						type="button"
						onClick={() => editor.chain().focus().setTextAlign("center").run()}
						className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
							editor.isActive({ textAlign: "center" })
								? "bg-primary text-white shadow-md"
								: "text-body hover:bg-primary/10"
						}`}
					>
						<span className="sr-only">Center</span>
						<AlignCenterIcon aria-hidden="true" className="size-4" />
					</button>
				</div>

				{/* Special Characters */}
				<div className="inline-flex rounded-lg bg-surface-muted p-1">
					<button
						type="button"
						onClick={() =>
							editor.chain().focus().insertContent({ type: "fabDash" }).run()
						}
						className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 text-body hover:bg-primary/10"
						title="Insert F&B dash"
					>
						<span className="sr-only">Insert F&B dash</span>
						{/* Visual preview of the dash bar */}
						<span
							aria-hidden="true"
							className="inline-block w-4 rounded-full bg-current"
							style={{ height: "2px", verticalAlign: "middle" }}
						/>
					</button>
				</div>

				{/* Custom Emojis Row 1 */}
				<div className="inline-flex rounded-lg bg-surface-muted p-1">
					{customEmojisRow1.map((emoji) => (
						<button
							key={emoji.name}
							type="button"
							onClick={() => editor.chain().focus().setEmoji(emoji.name).run()}
							className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 text-body hover:bg-primary/10"
						>
							<span className="sr-only">Add {emoji.name} icon</span>
							{emoji.fallbackImage && (
								<img
									src={emoji.fallbackImage}
									aria-hidden="true"
									alt={emoji.name}
									className="size-4"
								/>
							)}
						</button>
					))}
				</div>

				{/* Custom Emojis Row 2 */}
				<div className="inline-flex rounded-lg bg-surface-muted p-1">
					{customEmojisRow2.map((emoji) => (
						<button
							key={emoji.name}
							type="button"
							onClick={() => editor.chain().focus().setEmoji(emoji.name).run()}
							className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 text-body hover:bg-primary/10"
						>
							<span className="sr-only">Add {emoji.name} icon</span>
							{emoji.fallbackImage && (
								<img
									src={emoji.fallbackImage}
									aria-hidden="true"
									alt={emoji.name}
									className="size-4"
								/>
							)}
						</button>
					))}
				</div>
			</div>

			<div className="mt-3 min-h-32 focus-within:ring-1 focus-within:ring-primary/50 rounded-md transition-all duration-150">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
