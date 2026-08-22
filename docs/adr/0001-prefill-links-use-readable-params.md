# Prefill links use readable params, not an encoded payload

A link that opens the Card Creator with fields already filled in carries its values as named query params (`?type=action&name=Sink+Below&pitch=3`) rather than an encoded blob of card state. The consumer is an application outside FABKIT building a link from documentation, and readable params let it do that without depending on FABKIT internals.

## Considered options

Encoding `SerializedCardState` as `base64url(gzip(json))` in a single param was rejected. It is only producible by code that imports the serializer, and it would create a second wire format to version and migrate alongside the stored one. Exact-fidelity card sharing is already served by `.fabkit` export, which is a different feature to a prefill link.

## Consequences

The param names are a public API. They are append-only: a param is never renamed or removed, which is why there is no version param to bump.
