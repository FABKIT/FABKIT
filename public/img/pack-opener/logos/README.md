# Set logos

Logos for the sets Legend Story Studios' own card data has no logo for. Drop a
file in here, run `bun run build-pack-data`, and the set picker uses it. Nothing
else needs editing.

Most sets need nothing here: their logo comes straight from LSS and this folder
stays empty for them. A file in here also **overrides** an LSS logo of the same
set code, so this is equally the place to fix one that is broken or unusable.

## Naming

One file per set, named by its set code, with a `.webp` extension:

```
logos/PEN.webp
logos/GEM1.webp
```

The set code is the same one the pack artwork folders use, so a set's logo and
its pack fronts are always named the same thing.

## What is here today

| File | Set |
|------|-----|
| `PEN.webp` | Compendium of Rathe |
| `GEM1.webp` to `GEM5.webp` | GEM Packs 1 to 5 |

Every other set's logo comes from LSS.

## Size and shape

**256 px tall.** Width follows the artwork, up to **640 px** wide.

The picker draws a logo 64 px tall inside a 224 px wide space, so 256 px tall is
four times what it needs, which keeps it crisp on a high-resolution screen
without shipping anything bigger than it has to be. A logo wider than 640 px
still works, it is just carrying pixels nobody ever sees.

Anything wider than roughly 3.5 times its height gets limited by the width
rather than the height, so a very wide logo will draw shorter than 64 px. That
is correct behaviour, not a bug, and it is how LSS's own wide logos already
behave here.

**Transparent background**, since the picker sits on the page background and a
white box around a logo is very visible. `.webp` keeps transparency, so exporting
with an alpha channel is all that is needed.

A stacked logo (title over subtitle) is usually better than a long single line,
because the space is much wider than it is tall but the height is the limit. LSS
ship stacked versions of several of their own logos for exactly this reason.
