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
with none falls back to the placeholder pack.

Each GEM Pack is its own product with its own wrapper, so Pack 1's wrappers go
in `GEM1`, Pack 2's in `GEM2`, and so on.

**Format is `.webp`.** Keep the numbering unbroken: the build script stops at
the first missing number, so a folder holding `1.webp` and `3.webp` will only
ever show the first one.

A new set's folder appears in git once it holds its first `1.webp`.

## Size and shape

Baseline **796 x 1509** (the Welcome to Rathe art). Proportion matters more than
pixels: roughly **1 wide to 1.9 tall**, matching the 3D pack. Squarer art looks
stretched.

## Seal line

The 3D pack tears along a fixed line, **11.8% down from the top of the image**,
where the crimped foil strip ends on Legend Story Studios' product shots. Art
cropped like the Welcome to Rathe file tears correctly. If a set's art is framed
differently, adjust `PACK_SEAL_HEIGHT` in `src/apps/pack-opener/config/scene.ts`.

Transparent backgrounds are fine: the corners are cut out, not blended.
