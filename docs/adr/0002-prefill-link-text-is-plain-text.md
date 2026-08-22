# Prefill link card text is plain text, never HTML

The `text` param accepts plain text with `:cost:` style shortcodes and `**bold**` shorthand, and is converted into a Tiptap document, from which the HTML is generated. HTML is never accepted from a link.

The shorthand is interpreted, never passed through. The converter reads `:name:` and `**`, and decides for itself which nodes and marks the document contains; a link that writes `<b>` puts those three characters on the card. Both shorthands are the ones the editor's own input rules already recognise, so a link author and a user typing at the keyboard produce the same document.

`CardTextHTML` is passed to `dangerouslySetInnerHTML` by both `NormalRenderer` and `MeldRenderer`, so a param able to set it directly would be a scripting vector on the site. Keeping that value editor-produced means the surface never opens and no sanitiser sits on the critical path. Shortcodes cost external consumers nothing, since `extensions/Emoji.ts` already treats `:name:` as the canonical text form of a game symbol.

A reader finding the plain-text to Tiptap converter may wonder why the param does not simply set `CardTextHTML`. This is why.
