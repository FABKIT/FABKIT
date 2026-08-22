# Prefill links

A prefill link opens the FABKIT Card Creator with fields already filled in. Any
application can build one: it is a plain URL with named query params, and needs
no code from FABKIT.

```
https://fabkit.io/#/card-creator?type=action&name=Sink+Below&pitch=3&cost=0&defense=3&class=ninja&text=%3Adefense%3A+Instant
```

A prefill link carries a card's composition, not a saved card's identity. For
an exact copy of a card, including its artwork and frame, use the Card
Creator's own `.fabkit` export instead.

## Where the params go

FABKIT uses hash routing, so the query string goes **inside** the hash, after
the route:

```
https://fabkit.io/#/card-creator?type=hero&name=Dorinthea       correct
https://fabkit.io/?type=hero&name=Dorinthea#/card-creator       ignored
```

Values are URL-encoded as usual: `+` or `%20` for a space, `%3A` for the colons
around a shortcode, `%0A` for a line break.

## What happens when the link opens

The card is composed before the page is first drawn, and the params are then
removed from the address bar. The link applies once: nothing in it is re-applied
over the user's own edits afterwards, and the URL they can copy is a plain Card
Creator URL rather than your link.

The card lives in the page until the user saves it, so reloading starts an empty
Card Creator rather than reopening the link.

Anything in the link that cannot be applied is skipped, and the Card Creator
shows the user which params those were and why. The rest of the link still
applies: one bad param never costs you the whole card.

## Params

| Param | Sets | Accepted values |
|---|---|---|
| `type` | Card type | Any card type except `meld` |
| `style` | Frame style | `dented`, `flat` |
| `frame` | Frame | A frame name, case-insensitive |
| `frame2` | Right-hand frame | A frame name; setting it is what makes the card hybrid |
| `split` | Hybrid seam position | Whole number 2 to 98, percent across the card |
| `blend` | Hybrid seam softness | Whole number 0 to 100, percent of the widest blend |
| `name` | Card name | Any text |
| `pitch` | Pitch colour | `1`, `2`, `3` |
| `cost` | Resource cost | Any text |
| `power` | Power | Any text |
| `defense` | Defense | Any text |
| `life` | Life | Any text |
| `intellect` | Intellect | Any text |
| `class` | Class | A class name, e.g. `ninja` |
| `class2` | Second class | A class name |
| `talent` | Talent | A talent name, e.g. `shadow` |
| `subtype` | Subtype | Any text |
| `rarity` | Rarity | A rarity name, e.g. `majestic` |
| `weapon` | Weapon hands | `1h`, `2h` |
| `group` | Macro group | Any text |
| `text` | Card text | Plain text, with line breaks, `**bold**`, and `:shortcode:` symbols |
| `artist` | Artist credit | Any text |
| `setnumber` | Set number | Any text, shown uppercased |
| `art` | Artwork | An `https` image URL |

`pitch` is the card's pitch **colour**; `cost` is what it costs to play. The
Card Creator labels them Pitch and Cost.

Param names are lowercase. Any value that names something (`type`, `style`,
`class`, `class2`, `talent`, `rarity`, `weapon`, `frame`, `frame2`) is matched
case-insensitively, so `class=Ninja` and `class=ninja` are the same. Free text
is used exactly as you write it, apart from surrounding whitespace.

Param names never change and are never removed, so a published link keeps
working. That is also why there is no version param.

### Fields the card type doesn't have

Each card type shows its own set of fields: a hero has no pitch, an action has
no intellect. A param for a field the chosen type doesn't show is skipped and
reported, so set `type` first and build the rest of the link around it.

## Frames

`frame` and `frame2` take a frame's name, matched within the card type and
style the link asks for. Names repeat across types (Aria is both a general
frame and a hero frame), which is why `type` and `style` are what make a name
resolve to one frame.

The names are the ones the Card Creator's frame picker shows for that type and
style. A name that doesn't match is skipped and reported, and the card opens
with the frame that type and style would normally start on.

Some card types have frames in only one style: a weapon has no flat frames, for
instance. Asking for a style a type has no frames in opens the style that does
have them, and says so.

Custom frames, the ones a user uploads themselves, are never matched. They
exist only in that person's browser, so a public link resolving against one
would pick up whatever the recipient happened to upload under the same name.

### Hybrid cards

A card is hybrid exactly when it has a right-hand frame, so `frame2` is what
turns hybrid on. `frame2` on its own is fine: the left frame falls back to the
default for the type and style.

`split` and `blend` only mean anything on a hybrid card, so both are skipped
and reported if the link has no `frame2`. Both are whole percentages, and a
value outside the range is skipped rather than quietly pulled into it.

```
https://fabkit.io/#/card-creator?type=action&frame=aria&frame2=assassin&split=40&blend=60
```

## Card text

`text` is plain text. Line breaks start a new paragraph, and game symbols are
written as shortcodes:

`:cost:` `:power:` `:defense:` `:life:` `:intellect:` `:tap:` `:untap:` `:chi:`

A shortcode that isn't one of these stays as literal text, the same as it would
if a user typed it into the editor.

Bold is written `**like this**` or `__like this__`, the same shorthand the
editor turns into bold as you type. The opening delimiter has to start the line
or follow a space, so an underscore inside a word is left alone, and a
delimiter with no closing partner stays as literal characters. Italic and
underline have no shorthand in a link; apply those in the editor.

HTML is never accepted here. `<b>bold</b>` in a link arrives on the card as
those exact characters, angle brackets included.

## Artwork

`art` takes an `https` image URL, which FABKIT downloads and places on the
card. Two things decide whether it works:

- **The host must allow cross-origin reads.** The response needs an
  `Access-Control-Allow-Origin` header that permits fabkit.io. Many image hosts
  and CDNs do; many do not, and there is no way to tell without trying. Check
  the host you plan to use before publishing links that depend on it.
- **The image must be under 32 MB.**

If the image can't be fetched, for any reason, the card still opens with
everything else applied and the user is told the artwork was skipped.

Once the user saves the card, the image is stored in their browser, so the card
survives the source URL going away.

## Not addressable

Meld cards, custom frames, and the artwork's position and crop cannot be set
from a link.
