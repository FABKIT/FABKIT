# FABKIT

Browser-based tools for the Flesh and Blood TCG. This glossary fixes the words used across the codebase, docs, and UI copy, so the same concept is never named two ways.

## Language

### Card creator

**Card Creator**:
The app in which a user composes a Flesh and Blood card and exports it as an image.
_Avoid_: custom card builder, card builder, card maker

**Frame**:
The bordered card template that artwork and text are composed onto. Its type and style decide which frame images are available. Stored as `CardBack`, and surfaced in the UI as the background.
_Avoid_: border, cardback (as two words or hyphenated)

**Custom Frame**:
A frame image uploaded by the user rather than shipped with the app. In this codebase *custom* means this and nothing else, so a user-made card is never a "custom card".
_Avoid_: custom card, custom background, user frame

**Card Type**:
What the card is in the game (action, hero, weapon, and so on). It decides which form fields are visible and which frames are compatible.

**Card Style**:
The visual variant of a frame, independent of card type.

**Pitch**:
The colour of a card's pitch value, one of three. Distinct from cost.
_Avoid_: pitch cost, pitch value

**Cost**:
The resource cost to play the card. Distinct from pitch, despite living under the `CardResource` key.
_Avoid_: resource, resource cost

**Hybrid**:
A card whose frame is two frames joined at a vertical seam. A card is hybrid exactly when a right-hand frame is set; there is no separate flag.

**Meld Half**:
One of the two independently composed sides of a meld card. Each half carries its own type, name, artwork, and text.
_Avoid_: side, panel, face

**Prefill Link**:
A URL that opens the Card Creator with fields already filled in, built by an application outside FABKIT. It carries a card's composition, never a saved card's identity.
_Avoid_: share link, import link, deep link

### Gallery

**Gallery**:
The user's local collection of saved cards, held in the browser rather than on a server.

**Folder**:
A named grouping of saved cards in the gallery. Identified to the user by its path, not by its internal id.
