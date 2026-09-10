# Pull rate verification against the Collectors Centre

Every Flesh and Blood set has a Collectors Centre page carrying an
"estimated rarity breakdown", for example
<https://fabtcg.com/collectors-centre/high-seas/>. These are far more
detailed than the product pages this app's odds were originally built from:
they give a per-pack expectation for each rarity, and for the newer sets they
break the Premium Foil slot out separately with its own rates.

This document records what those pages say and how far our engine currently
differs. It is a to-do list, not a description of the app.

## Status

**Our odds are materially wrong for most sets.** Majestics, Legendaries and
Marvels all come up far more often than they should. This matches what
opening packs in the app feels like next to opening them in a store.

The disclaimer in the pull-rates dialog covers us for now, but these numbers
should be corrected set by set.

## How far off we are

Only rows outside a 0.8x to 1.25x band are listed. Anything not listed is
close enough to leave alone for now. "Published" and "Ours" are both expected
cards per pack.

| Set | Rarity | Published | Ours | Ours vs published |
| --- | --- | --- | --- | --- |
| EVR | majestic | 0.250 | 1.239 | **5.0x** |
| EVR | legendary | 0.006 | 0.083 | **13.2x** |
| 1HP | legendary | 0.012 | 0.048 | **3.9x** |
| UPR | majestic | 0.250 | 0.346 | **1.4x** |
| UPR | legendary | 0.017 | 0.045 | **2.6x** |
| DYN | majestic | 0.250 | 0.386 | **1.5x** |
| DYN | legendary | 0.015 | 0.044 | **2.9x** |
| OUT | legendary | 0.018 | 0.014 | **0.8x** |
| DTD | majestic | 0.250 | 0.421 | **1.7x** |
| DTD | legendary | 0.016 | 0.078 | **5.0x** |
| EVO | majestic | 0.250 | 0.935 | **3.7x** |
| EVO | legendary | 0.014 | 0.160 | **11.2x** |
| HVY | majestic | 0.306 | 0.772 | **2.5x** |
| HVY | legendary | 0.010 | 0.200 | **19.2x** |
| HVY | marvel | 0.005 | 0.400 | **76.8x** |
| MST | majestic | 0.306 | 0.785 | **2.6x** |
| MST | legendary | 0.010 | 0.162 | **15.6x** |
| MST | marvel | 0.010 | 0.486 | **48.6x** |
| ROS | rare | 2.038 | 1.626 | **0.8x** |
| ROS | majestic | 0.306 | 0.811 | **2.7x** |
| ROS | legendary | 0.010 | 0.125 | **12.0x** |
| ROS | token | 1.540 | 1.938 | **1.3x** |
| HNT | majestic | 0.306 | 0.804 | **2.6x** |
| HNT | legendary | 0.010 | 0.152 | **14.5x** |
| HNT | token | 1.540 | 1.941 | **1.3x** |
| SEA | majestic | 0.306 | 0.534 | **1.7x** |
| SEA | legendary | 0.010 | 0.075 | **7.2x** |
| SEA | marvel | 0.017 | 0.463 | **27.8x** |
| SUP | superrare | 0.536 | 0.426 | **0.8x** |
| SUP | majestic | 0.045 | 0.745 | **16.4x** |
| SUP | legendary | 0.011 | 0.043 | **4.0x** |

Sets not listed at all (Welcome to Rathe, Arcane Rising, Crucible of War,
Monarch, Tales of Aria) already match. Those are the ones whose configs were
worked out from published odds rather than from card populations, which is
the pattern worth repeating.

### Caveats on the table

- **Super Slam's Majestic row is not a fair comparison.** Its page lists "42
  Majestic" in the base breakdown with no rate attached, and only gives a rate
  for the Premium Foil slot's Majestics (1 per 22). The published figure used
  here is therefore only part of the story and the 16.4x is overstated.
- **Compendium of Rathe and Omens of the Third Age are missing.** Their pages
  render the breakdown behind JavaScript tabs rather than in the page text, so
  the scrape did not pick them up. They need a manual look.
- Where a page prints "1 per ??? packs" (Fabled on nearly every set, Marvel on
  several) there is no published number to compare against.

## Why we are off

Two patterns account for most of it.

1. **Rarity slots modelled from card population rather than published rates.**
   Where a slot is "Rare or Majestic" and the set has 51 Rares and 56
   Majestics, weighting by those populations produces far more Majestics than
   the published 1 per 4 packs. Population tells you how many distinct cards
   exist at a rarity, not how often that rarity is inserted.
2. **Marvel and Legendary treated as generic long-tail rolls.** The engine
   carries default chances for these where a set's page now gives a real
   number, for example Marvel at 1 per 60 packs for High Seas against our
   roughly 1 in 2.

## Doing the corrections

Each set's config in `src/apps/pack-opener/pack/set-configs.ts` documents its
own sourcing in a comment above it. When correcting one:

- Work from the published per-pack rate, not the card population.
- Sum the base breakdown and the Premium Foil slot's own breakdown where the
  page lists both; a pack contains one of each.
- `tests/pack-opener/` carries calibration tests comparing the engine's
  expected counts against each config's stated intent. Update those in step.

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
