# Prefill link artwork accepts any https host

The `art` param takes an image URL, which is fetched to a Blob and handed to `setCardArtwork`. Any `https` host is accepted, bounded by a size ceiling, with no allowlist of permitted image hosts.

## Considered options

An allowlist was rejected because it does not address either real risk. Opening a link makes the recipient's browser reach an attacker-chosen host, disclosing IP and user agent, and a hand-crafted link can render arbitrary imagery inside a page that looks like FABKIT. Both work exactly as well from an allowlisted image host, so an allowlist would cost reach and ongoing maintenance while looking like a security control that it is not.

## Consequences

The URL is fetched to a Blob rather than placed in the SVG `image` href. This is deliberate: the renderer resolves the Blob to a same-origin `blob:` URL, so snapdom never captures a cross-origin image and PNG export cannot be broken by a tainted canvas. Placing the remote URL in the href directly would reintroduce that.

The source host must send `Access-Control-Allow-Origin`, since an opaque `no-cors` response yields an unusable blob. Support has to be confirmed per host. Any failure surfaces in the ignored-params notice and the card still opens with everything else applied.
