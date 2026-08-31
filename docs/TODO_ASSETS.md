# Asset Checklist Moved

This legacy checklist is deprecated because it drifted from actual gameplay use
and did not provide production-ready specifications.

Use [ASSET_PRODUCTION_BACKLOG.md](ASSET_PRODUCTION_BACKLOG.md) as the canonical,
generated owner-facing creative checklist. It groups assets by subject and gives
each concept a plain-language name plus a short prompt consistent with the game's
funerary grimdark direction.

Exact paths, dimensions, frames, orientation, pivot, transparency, attachments,
and runtime-presentation requirements remain canonical in
`src/game/data/assets.ts`. Use the technical SVG templates and Content Lab when
preparing and qualifying a delivered file.

Run `npm run assets:backlog` after changing registered content, creative briefs,
or asset metadata.
Do not maintain a second handwritten asset inventory here.
