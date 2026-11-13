# Set logos

Logos for sets that Legend Story Studios' card data has no logo for. Drop a file in
here and run `bun run build-pack-data`; the set picker uses it. A file here also
overrides an LSS logo with the same set code.

The logos from Welcome to Rathe up to Super Slam are also kept here. The card data
still points at an LSS image host that has shut down, so these copies were recovered
from the Internet Archive.

## Naming

One file per set, named by set code, `.webp`: `PEN.webp`, `GEM1.webp`.

## Size

256 px tall, up to 640 px wide, with a transparent background (export with an alpha
channel). The picker draws logos 64 px tall in a 224 px wide space, so a very wide
logo draws shorter. Prefer a stacked logo over a long single line.
