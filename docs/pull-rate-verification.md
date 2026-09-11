# Pull rates against the Collectors Centre

Every Flesh and Blood set has a Collectors Centre page carrying an
"estimated rarity breakdown", for example
<https://fabtcg.com/collectors-centre/high-seas/>. These are far more
detailed than the product pages this app's odds were originally built from:
they give a per-pack expectation for each rarity, and for the newer sets they
break the Premium Foil slot out separately with its own rates.

This document is the transcription those configs are derived from. The
figures below are the source; `src/apps/pack-opener/pack/set-configs.ts` is
where they are applied, one comment per set citing the lines it used.

## Status

**Every set with a readable Collectors Centre page now deals its published
rates**, verified by `tests/pack-opener/calibration.test.ts`, which simulates
200,000 packs per set and asserts each rarity within 20% of the figure
published here.

Before this, Majestics, Legendaries and Marvels all came up far more often
than they should, because most slots were weighted by how many distinct cards
a set prints at a rarity rather than by how often that rarity is inserted.
High Seas was the extreme case: a Marvel every 2 packs against a published 1
per 60.

All twenty sets are covered. Compendium of Rathe and Omens of the Third Age
came last: their pages render the breakdown behind JavaScript tabs rather
than in the page text, so the scrape never captured them and the product
owner read both off the live pages by hand. Their figures are recorded below
with the rest.

## What is published and what is not

Where a page prints "1 per ??? packs", there is no number to use and none was
invented.

- **Fabled is unpublished on every set**: every page prints "1 per ???
  packs". It is ESTIMATED at half the set's own Marvel rate, on the product
  owner's instruction, so a set's single rarest card stays reachable rather
  than unpullable. That lands between 1 per 120 packs (High Seas) and 1 per
  780 (Outsiders), 1 per 200 for the sets with no Marvel rate of their own.
  History Pack 1 and Compendium of Rathe deal none: the first's Fabled cards
  are Black Label product, the second prints none at all.
- **Marvel is published for eight sets**: High Seas 1 per 60, Dynasty and
  Compendium of Rathe 1 per 96, Part the Mistveil and Dusk till Dawn 1 per
  100, Uprising 1 per 110, Heavy Hitters 1 per 192, Outsiders 1 per 390.
  Bright Lights, The Hunted, Rosetta, Omens and Super Slam have real Marvel
  printings but no published rate, and use `ESTIMATED_MARVEL_CHANCE`, a
  flagged estimate at 1 per 100, the median of the eight. History Pack 1
  stays at zero: its Marvels are Black Label product, not boosters.
- **Super Slam publishes no base Majestic rate**, only its Premium Foil
  slot's 1 per 22. Its Majestic total therefore comes from that plus its
  published Set (1 per 8) and Expansion (1 per 6) content, which is Majestic
  rarity in the card data.
- **Uprising, Dynasty and Dusk till Dawn print no expansion-slot Majestic**
  in the-fab-cube's data at all, so their published Majestic rate is not
  split with an expansion entry the way the later sets' is.

## How the newer pages are read

Sets from Heavy Hitters onward list two blocks: a base rarity breakdown, then
a second one under "Premium Foil (1 per pack)". That second block is the
Premium Foil card's own rarity table, not another set of pack-wide rates. The
tell is that its listed rates sum to about 1.0, and a block summing to one
card describes one card. So a rarity listed in both blocks has a per-pack
rate that is the sum of the two, and a rarity listed only in the premium
block (Legendary, and Marvel on High Seas) is drawn from that slot alone.

The product pages name what *can* appear in a slot; the Collectors Centre
gives the rates. Where the two disagree on structure, the rates win, because
rates are what the app models.

Normalising a block that sums to 1.02 or 1.04 back down to exactly one card
costs each of its rates 2% to 4%. That is inside the calibration tolerance
and is noted in the configs rather than corrected for.

## Published figures, as scraped

Transcribed on 2026-09-11. Newer sets list three blocks: the base rarity
breakdown, then the Premium Foil slot's own breakdown, then the Cold Foil
breakdown.

### WTR : Welcome to Rathe
Source: https://fabtcg.com/collectors-centre/welcome-to-rathe/
```
1 Fabled (1 per ??? packs)
5 Legendary (1 per 96 packs)
10 Majestic (1 per 12 packs)
15 Super Rares (1 per 6 packs)
48 Rares (1.75 per pack)
132 Commons (12 per pack)
15 Tokens (1 per pack)
Premium Foil (1 per pack, with Alpha Print containing 1 Cold Foil every 24 packs)
```

### ARC : Arcane Rising
Source: https://fabtcg.com/collectors-centre/arcane-rising/
```
1 Fabled (1 per ??? packs)
5 Legendary (1 per 96 packs)
10 Majestic (1 per 12 packs)
15 Super Rares (1 per 6 packs)
48 Rares (1.75 per pack)
126 Commons (12 per pack)
14 Tokens (1 per pack)
Premium Foil (1 per pack, with First Edition containing 1 Cold Foil every 24 packs)
```

### CRU : Crucible of War
Source: https://fabtcg.com/collectors-centre/crucible-of-war/
```
1 Fabled (1 per ??? packs)
2 Legendary (1 per 240 packs)
36 Majestic (1 per 4 packs)
56 Rare (1.75 per pack)
103 Common (7 per pack)
Premium Foil (1 per pack, with First Edition containing 1 Cold Foil every 22 packs)
```

### MON : Monarch
Source: https://fabtcg.com/collectors-centre/monarch/
```
1 Fabled (1 per ??? packs)
6 Legendary (1 per 96 packs)
31 Majestic (1 per 4 packs)
79 Rares (1.75 per pack)
172 Commons (12 per pack)
18 Tokens (1 per pack)
Premium Foil (1 per pack, with First Edition containing 1 Cold Foil every 22 packs)
```

### ELE : Tales of Aria
Source: https://fabtcg.com/collectors-centre/tales-of-aria/
```
1 Fabled (1 per ??? packs)
6 Legendary (1 per 88 packs)
27 Majestic (1 per 4 packs)
54 Rares (1.75 per pack)
136 Commons (12 per pack)
14 Tokens (1 per pack)
Premium Foil (1 per pack, with First Edition also containing 1 Cold Foil every 20 packs)
```

### EVR : Everfest
Source: https://fabtcg.com/collectors-centre/everfest/
```
1 Fabled (1 per ??? packs)
3 Legendary (1 per 160 packs)
45 Majestic (1 per 4 packs, with a chance at a Carnival themed Majestic at 1 per 26 packs)
61 Rares (1.65 per pack)
88 Commons (7 per pack)
Rainbow Foil (1 per pack)
Cold Foil (1 per 16 packs)
```

### 1HP : History Pack 1
Source: https://fabtcg.com/collectors-centre/history-pack-1/
```
9 Legendary (1 per 82 packs)
62 Majestic (1 per 3.15 packs)
118 Rares (1.65 per pack)
208 Commons (7 per pack)
*3 Fabled (1 per ???) - only features in Black Label product
*8 Marvel (1 per ???) - only featured in Black Label product
```

### UPR : Uprising
Source: https://fabtcg.com/collectors-centre/uprising/
```
1 Fabled (1 per ??? packs)
6 Legendary (Rainbow Foil - 1 per 80 packs), (Cold Foil - 1 per 220 packs)
27 Majestic (1 per 4 packs)
51 Rares (1.75 per pack)
125 Commons (11 per pack)
16 Tokens (1.75 tokens per pack)
Premium Foil (1 per pack)
Cold Foil (1 per 24 packs)
Marvel (1 per ??? packs)
```

### DYN : Dynasty
Source: https://fabtcg.com/collectors-centre/dynasty/
```
1 Fabled (1 per ??? packs)
14 Marvel (1 per ??? packs)
5 Legendary (Rainbow Foil - 1:88 packs // Cold Foil - 1:280 packs)
51 Majestic (1:4 packs)
81 Rares (1.75 per pack)
109 Commons (7 per pack)
Cold Foil (1:24 packs)
Premium Foil (1 per pack)
```

### OUT : Outsiders
Source: https://fabtcg.com/collectors-centre/outsiders/
```
1 Fabled (1 per ??? packs)
5 Legendary (Rainbow Foil - 1:70 packs / Cold Foil - 1:264 packs)
31 Majestic (1 per 5 packs)
51 Rares (1.75 per pack)
128 Commons (11 per pack)
20 Tokens (1.75 tokens per pack)
Premium Foil (1 per pack)
Cold Foil (1 per 24 packs)
3 Marvels (1 per ??? packs)
```

### DTD : Dusk till Dawn
Source: https://fabtcg.com/collectors-centre/dusk-till-dawn/
```
1 Fabled (1 per ??? packs)
8 Legendary (1 per 64 packs)
56 Majestic (1 per 4 packs)
77 Rares (1.68 per pack)
94 Commons (7 per pack)
Premium Foil (1 per pack)
Cold Foil (1 per 24 packs)
10 Marvels (1 per ??? packs)
10 Prism, Sculptor of Arc Light Cold Foil serialized artist sketch cards (1 per ??? packs)
10 Chane, Bound by Shadow Cold Foil serialized artist sketch cards (1 per ??? packs)
```

### EVO : Bright Lights
Source: https://fabtcg.com/collectors-centre/bright-lights/
```
1 Fabled (1 per ??? packs)
7 Legendary (1 per 70 packs)
46 Majestic (1 per 4 packs)
56 Rare (1.68 per pack)
129 Common (11 per pack)
12 Token (1.8~ per pack)
Premium Foil (1 per pack)
Cold Foil (1 per 24 packs)
9 Marvels (1 per ??? packs)
```

### HVY : Heavy Hitters
Source: https://fabtcg.com/collectors-centre/heavy-hitters/
Base breakdown, then the Premium Foil slot, then Cold Foil.
```
40* Majestic (1 per 4 packs)
66** Rare (1.83 per pack)
128 Common (11 per pack)
15 Token (1.85 per pack)
Premium Foil (1 per pack)
5 Legendary (1 per 96 packs)
31 Majestic (1 per 18 packs)
51 Rare (5 per 24 packs)
92 Common (18 per 24 packs)
33 Cold Foil (1 per 24 packs)
1 Fabled
5 Legendary
3 Majestic
7 Rare
17 Common
10 Marvels (1 per 192 packs)
*10 Majestics are Expansion content to support heroes and classes not in the core product.
**High Riser is upshifted from Token to Rare when in Cold Foil
```

### MST : Part the Mistveil
Source: https://fabtcg.com/collectors-centre/part-the-mistveil/
```
1 Fabled
6 Legendary*
43 Majestic (1 per 4 packs)
54 Rare (1.83 per pack)
123 Common (11 per pack)
12 Token (1.84 per pack)
Premium Foil (1 per pack)
1 Fabled (1 per ??? packs)
6 Legendary (1 per 96 packs)
32 Majestic (1 per 18 packs)
45 Rare (5 per 24 packs)
86 Common (18 per 24 packs)
28 Cold Foil (1 per 24 packs)
1 Fabled
5 Legendary
5 Majestic
3 Rare
14 Common
18* Marvels (1 per 100 packs)
13 Majestics are Expansion content.
```

### ROS : Rosetta
Source: https://fabtcg.com/collectors-centre/rosetta/
```
1 Fabled
5 Legendary*
49 Majestic (1 per 4 packs)
57 Rare (1.83 per pack)
128 Common (11 per pack)
14 Token (1.54 per pack)
36 Puzzle (6 per 24 packs)
Premium Foil (1 per pack)
1 Fabled (1 per ??? packs)
5 Legendary (1 per 96 packs)
40 Majestic (1 per 18 packs)
52 Rare (5 per 24 packs)
81 Common (18 per 24 packs)
28 Cold Foil (1 per 24 packs)
1 Fabled
5 Legendary
8 Majestic
5 Token
11 Common
24* Marvels
15 Majestics are Expansion content.
```

### HNT : The Hunted
Source: https://fabtcg.com/collectors-centre/the-hunted/
```
1 Fabled
6 Legendary**
42 Majestic* (1 per 4 packs)
66 Rare (1.83 per pack)
130 Common (11 per pack)
16 Token (1.54 per pack)
Premium Foil (1 per pack)
1 Fabled (1 per ??? packs)
6 Legendary (1 per 96 packs)
33 Majestic (1 per 18 packs)
60 Rare (5 per 24 packs)
107 Common (18 per 24 packs)
33 Cold Foil (1 per 24 packs)
1 Fabled
5 Legendary
7 Majestic
4 Rare
16 Common
17 Marvels
*15 Majestics are Expansion content.
```

### SEA : High Seas
Source: https://fabtcg.com/collectors-centre/high-seas/
```
1 Fabled
6 Legendary
46 Majestic (1 per 4 packs)
64 Rare (1.83 per pack)
127 Common (11 per pack)
18 Basic
Premium Foil (1 per pack)
1 Fabled (1 per ??? packs)
6 Legendary (1 per 96 packs)
33 Majestic (1 per 18 packs)
60 Rare (5 per 24 packs)
85 Common (18 per 24 packs)
21 Marvels (1 per 60 packs)
```

### SUP : Super Slam
Source: https://fabtcg.com/collectors-centre/super-slam/
```
1 Fabled
5 Legendary
42 Majestic
14 Set (1 per 8 packs)
24 Expansion (1 per 6 packs)
40 Super Rare (1 per 2.18 packs)
40 Rare (1.42 per pack)
134 Common (11 per pack)
14 Basic
1 Premium Foil (1 per pack)
1 Fabled (1 per ??? packs)
5 Legendary (1 per 94 packs)
21 Majestic (1 per 22 packs)
36 Super Rare (1 per 13 packs)
39 Rare (4 per 24 packs)
111 Common (17 per 24 packs)
47 Cold Foil (1 per 24 packs)
1 Fabled
14 Marvel
5 Legendary
13 Majestic
1 Rare
13 Common
```

### PEN : Compendium of Rathe, and OMN : Omens of the Third Age

Not captured. Both pages render their breakdown behind JavaScript tabs
("ESTIMATED RARITY BREAKDOWN - EN") rather than in the page text. They need a
manual visit.

### PEN : Compendium of Rathe
Source: https://fabtcg.com/collectors-centre/compendium-of-rathe/ , read off
the live page by hand (JavaScript tabs).
```
8 Legendary (1 per 140 packs)
59 Majestic (1 per 3.15 packs)
124 Rare (2.55 per pack)
142 Common (5 per pack)
1 Premium Foil (1 per pack)
    30 Majestic (1 per 24 packs)
    59 Rare (5 per 24 packs)
    140 Common (18 per 24 packs)
Cold Foil (1 per 8 packs)
    21 Majestic
    60 Rare
23 Marvel (1 per 96 packs)
```

### OMN : Omens of the Third Age
Source: https://fabtcg.com/collectors-centre/omens-of-the-third-age/ , read
off the live page by hand (JavaScript tabs).
```
1 Fabled
5 Legendary
37 Majestic
    15 Set (1 per 8 packs)
    22 Expansion (1 per 7 packs)
60 Rare (1.88 per pack)
134 Common (11 per pack)
14 Basic (1.8 per pack)
1 Premium Foil (1 per pack)
    1 Fabled (1 per ??? packs)
    5 Legendary (1 per 96 packs)
    14 Majestic (1 per 42 packs)
    59 Rare (5.5 per 24 packs)
    105 Common (18 per 24 packs)
Cold Foil (1 per 24 packs)
    1 Fabled
    5 Legendary
    20 Majestic
    12 Common
    12 Marvel
```

### ANQ : Compendium of Rathe - Antiquity Pack
Source: LSS's published "Estimated Rarity Breakdown - EN", supplied by the
product owner. Not captured by the scrape for the same reason PEN and OMN
were not.
```
1 Marvel (1 per 800 packs)
3 Fabled (1 per 45 packs)
7 Legendary (1 per 20 packs)
17 Majestic
    17 Regular (7 per 8 packs)
    17 Cold Foil (1 per 8 packs)
10 Rare (1 per pack)
3 Puzzles, 9 cards per puzzle (1 per pack)
```
Carrying LSS's own disclaimer, which applies to every figure in this file:
"Stated card drop frequencies are an approximate average across the entire
production of a product, and are not guaranteed to exist in any given pack,
display, or case of product. Due to variations that may occur in the
manufacturing process, final distributions of cards may differ from those
stated above."

Two things about this one differ from every other set here.

**It is the only set with a published Fabled rate.** Every Collectors Centre
page prints "1 per ??? packs" for Fabled, which is why the rest are ESTIMATED
at half the set's Marvel rate. This one states 1 per 45, and at 1 per 800
Marvel it is nowhere near half — so it is used as published, and the estimate
rule does not apply to it.

**The puzzle slot is not modelled.** Its 27 puzzle cards (3 puzzles of 9) are
in no card dataset this app builds from, under any set code, so there is
nothing to deal for that slot. The other 55 cards above are all present, and
55 is exactly what upstream carries for ANQ. So the pack opens as two cards
rather than three. Legendary, which LSS deals out of the puzzle slot, is
folded into the Rare slot instead at its published 1 per 20, so the rate a
player actually experiences is preserved rather than dropped along with the
puzzles.

**The Rare slot's 10 cards** are filed upstream as 6 Common and 4 Rare. LSS
counts all 10 as "Rare". The config weights them 6 to 4 so each of the 10 is
equally likely, which is the only split the published "1 per pack" supports
without inventing one.
