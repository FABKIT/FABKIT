# Booster pack artwork

One folder per set, named by its set code. Drop each set's pack fronts
straight into its folder. Nothing else needs editing: `bun run build-pack-data`
picks up whatever is here and the pack opener uses it automatically.

## Naming

Number the files from 1, in any order:

```
packs/WTR/1.webp
packs/WTR/2.webp
packs/WTR/3.webp
```

A set with several pack arts gets several files, and the opener picks one at
random each time a pack is opened. A set with one art just has `1.webp`. A set
with none falls back to the placeholder pack, which is fine and is what the six
empty folders show today: `GEM1` to `GEM5` and `MPG`.

Each GEM Pack is its own product with its own wrapper, so Pack 1's wrappers go
in `GEM1`, Pack 2's in `GEM2`, and so on. Pack 1 has three wrappers, so that
folder wants `1.webp`, `2.webp` and `3.webp`.

**Format is `.webp`.** Keep the numbering unbroken: the build script stops at
the first missing number, so a folder holding `1.webp` and `3.webp` will only
ever show the first one.

## Size and shape

The baseline is **796 x 1509**, taken from the Welcome to Rathe art already in
here. What actually matters is the proportion rather than the exact pixels:
roughly **1 wide to 1.9 tall**, matching the 3D pack model. Something noticeably
squarer will look stretched.

## The one thing to watch

The 3D pack tears along a fixed line, **11.8% down from the top of the image**,
which is where the crimped foil strip ends and the printed face begins on Legend
Story Studios' own product shots. Art cropped the same way as the Welcome to
Rathe file will tear correctly with no further work.

If a set's art is framed differently, the pack will tear in slightly the wrong
place, leaving a band of crimp attached or slicing into the artwork. That is a
one-number fix (`PACK_SEAL_HEIGHT` in
`src/apps/pack-opener/config/scene.ts`), so just say which set looks wrong.

Transparent backgrounds are expected and handled: the corners are cut out rather
than blended, so a cut-out product shot will not show a dark halo.

## The `.gitkeep` files

Git does not track empty folders. Each set folder holds a small marker file
naming its set so the folders survive a fresh clone. Leave them where they are;
they are ignored by everything that reads this directory.
