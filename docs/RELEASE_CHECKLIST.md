# Browser Demo Release Checklist

This checklist is intentionally conservative. Check an item only against the
exact revision being released and record the command, browser, deployment, or
human session that supplied the evidence. Older successful runs are historical.

## Automated Revision Gate

- [ ] Working tree/release revision is identified and intended files are present.
- [ ] Dependency install from the lockfile succeeds.
- [ ] `npm run validate:content` succeeds with no unresolved required resource.
- [ ] `npm run assets:backlog:check` reports no manifest/backlog drift.
- [ ] `npm run balance:diagnostics` completes and every warning is reviewed.
- [ ] `npm run lint` succeeds; existing warnings are recorded separately.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm test` succeeds with the exact passing test count recorded.
- [ ] `npm run build` succeeds.
- [ ] The production-bundle scan proves Dev Mode and Content Lab are absent from a
  normal production bundle.
- [ ] `npm run smoke:dev` succeeds with captures and no unexpected console/page
  errors.
- [ ] `npm run smoke:prod` succeeds against a fresh build with captures and no
  unexpected console/page errors.
- [ ] CI succeeds on the exact release revision.

There is no formatter command in the repository at present. Do not check or
report a formatting gate unless one is introduced.

## Demo-Critical Owner Content

- [ ] Every item in the **Minimum playable/demo-critical** asset-backlog section
  is delivered or explicitly approved in its fallback form.
- [ ] Every item in **Required presentation polish** is delivered or accepted for
  this demo milestone.
- [ ] All shipped art, fonts, VVFX dependencies, audio, and music have confirmed
  rights, credits, and provenance.
- [ ] Procedural audio is replaced or explicitly approved as the demo audio.
- [ ] Final assets have been checked in Content Lab for dimensions, pivot,
  attachment points, collision/readability, animation, mirroring, and cleanup.
- [ ] Title/store art, screenshots, and trailer are produced if the distribution
  channel requires them.

Optional variation and post-demo backlog items are not demo blockers unless the
release scope is explicitly expanded.

## Manual Gameplay And Presentation

- [ ] Complete several unassisted fifteen-minute keyboard runs.
- [ ] Complete comparable runs with Haunted, The Penitent, and Ashwalker.
- [ ] Exercise representative five-weapon builds through level-seven evolutions
  and focused specializations.
- [ ] Exercise curses, reroll, skip, blood shrine, all three powerups,
  reliquaries/artifacts, Blood Market, late encounters, and Death Echo.
- [ ] Defeat and lose to the six-attack, three-phase Warden; review fight duration,
  safe routes, telegraphs, and crowd readability.
- [ ] Review final hit flashes, status overlays, projectiles, hazards, chain
  lightning, impacts, audio, and camera feedback under realistic late-run load.
- [ ] Compare uploaded/local run reports for survivability, progression pacing,
  weapon contribution, incoming sources, and Warden duration before final tuning.
- [ ] Perform a photosensitivity review and add a warning if warranted.

## Browser And Layout Qualification

- [ ] Chrome hands-on pass
- [ ] Edge hands-on pass
- [ ] Firefox hands-on pass
- [ ] Safari hands-on pass, or explicitly recorded platform block
- [ ] Common laptop viewport pass
- [ ] Standard 16:9 viewport pass
- [ ] Ultrawide viewport pass
- [ ] Keyboard focus, menus, pause, submenu return, restart, and return-to-site pass
- [ ] Console, failed requests, screenshots, and visible layout evidence retained

The headless smoke does not satisfy these manual items.

## Persistence, Services, And Distribution

- [ ] Old and corrupt local saves migrate safely in a deployed build update.
- [ ] Death and victory results preserve local progression and journal discovery.
- [ ] Completed standard runs reach private run analytics.
- [ ] Valid named scores reach the public leaderboard without duplicate analytics.
- [ ] Direct anonymous Supabase inserts fail while intended public reads succeed.
- [ ] Netlify environment variables/functions are verified on the target deploy.
- [ ] A private distribution build receives external playtest feedback.
- [ ] Known failures, blocks, and untested surfaces are recorded with owners.

## Public-Demo Decision

- [ ] The exact automated gate is green.
- [ ] Demo-critical owner content is approved.
- [ ] Manual gameplay, browser/layout, service, rights, and accessibility-risk
  reviews are complete.
- [ ] Remaining issues are explicitly accepted and do not break the intended
  vertical slice.

Until all four groups are satisfied, describe the build as a vertical-slice
candidate rather than public-demo ready.

## Post-Demo Desktop Work

- [ ] Choose and validate a desktop wrapper.
- [ ] Add controller support and controller glyphs.
- [ ] Add platform-specific quit/fullscreen behavior.
- [ ] Investigate Steamworks only after the browser demo loop is proven.
