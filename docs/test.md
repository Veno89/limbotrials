Has been implemented?
- Finishing a run unlocks NG+ where the player gets to fight harder enemies and more bosses. FOr increased rewards they may also add from a set of modifiers which makes the game even harder.
- Right now artifacts are just a bunch of increased stats, let's create some more unique ones that can define a run.
- Create a unique asset for every artifact, that fits well into our theme.
- Add a "suction" effect to xp globes when using the magnet pick-up.

Latest feedback implemented:
- [x] Elite charges now travel the complete telegraphed distance and use a red danger telegraph.
- [x] Unevolved Bloodletter Axe always completes its maximum-range outbound throw before returning.
- [x] Removed the floating "Reliquary" world label.
- [x] Replaced the Reliquary indicator window with a compact compass, distance, and timer line.

# AI Agent Task: Fully Automated Trailer Creation for Everlasting Oblivion: Limbo Trial

You are taking over as a senior game-dev automation engineer, trailer editor, gameplay capture engineer, and marketing-focused trailer creator.

Your task is to create a finished gameplay trailer for **Everlasting Oblivion: Limbo Trial** with as little user involvement as possible. The user should not need to manually record footage, manually edit video, manually pick clips, or manually run complex commands.

This first attempt should **not** require implementing a dedicated `trailerMode` flag unless absolutely necessary. The goal is to make a usable trailer from the current state of the game using real gameplay footage, automation, browser/e2e capture, FFmpeg, and whatever tooling is already available or can reasonably be added to the project.

## Core Goal

Create a finished trailer video file for:

**Everlasting Oblivion: Limbo Trial**

Target trailer length:

* Ideal: **30–45 seconds**
* Acceptable: **20–60 seconds** if the available gameplay footage makes that more realistic

The trailer should be exported as:

```txt
/trailers/everlasting-oblivion-limbo-trial-trailer.mp4
```

Also create a shorter social version if practical:

```txt
/trailers/everlasting-oblivion-limbo-trial-short.mp4
```

Do not use fake AI-generated gameplay footage. The trailer must show real captured footage from the actual game.

---

## Important Constraints

1. **Do not require manual user work.**

   * Do not ask the user to manually record footage.
   * Do not ask the user to manually edit clips.
   * Do not ask the user to open OBS.
   * Do not ask the user to choose timestamps manually.
   * Automate as much as possible.

2. **Use real gameplay footage.**

   * The trailer must show the actual game.
   * Do not create misleading AI-video footage.
   * Do not generate fake gameplay that looks better than the real game.

3. **Avoid risky/copyrighted assets.**

   * Do not use copyrighted music, copyrighted sound effects, or copyrighted artwork.
   * Prefer existing game audio/assets if available.
   * If no usable music exists, generate a simple royalty-safe ambient trailer bed programmatically or use silence with impact sound effects/text.

4. **Prefer safe, local tooling.**

   * Use existing project scripts first.
   * Use Playwright/browser automation if available.
   * Use FFmpeg for cutting, stitching, scaling, overlays, fades, and audio.
   * If FFmpeg is not installed, add clear fallback instructions and scripts, but still produce everything else possible.

5. **Keep normal game code safe.**

   * Do not break normal gameplay.
   * Do not introduce permanent hacks into production gameplay.
   * If temporary helper scripts are needed, place them under a clear folder such as:

     ```txt
     /tools/trailer/
     /scripts/trailer/
     /trailers/
     ```
   * If you must touch game code, isolate the changes and document them.

6. **No “claiming done” unless the file exists.**

   * Only say the trailer is complete if the final `.mp4` file was actually created.
   * If export fails, explain exactly what failed and leave behind scripts/configs so the next run can continue.

---

## Project Discovery Phase

First, inspect the project structure and determine:

* Package manager: npm, pnpm, yarn, bun, etc.
* Game framework: Phaser/Vite/React/etc.
* Dev command
* Build command
* Existing test/e2e tooling
* Existing asset folders
* Existing music/SFX folders
* Existing screenshots/video tooling
* Current routes or startup behavior
* Whether the game can run in browser locally
* Whether Playwright is already installed
* Whether FFmpeg is available on the system

Create or update this file:

```txt
/trailers/TRAILER_CREATION_REPORT.md
```

The report should contain:

* What tools were found
* What commands were used
* What capture method was chosen
* What final files were produced
* Any limitations
* Any recommended next step if the trailer is not good enough

---

## Preferred Automation Strategy

Use this order of preference:

### Strategy A: Automated Browser Capture

If the game runs in a browser:

1. Start the local dev server automatically.
2. Open the game in a controlled browser session.
3. Use Playwright or another browser automation method to:

   * load the game
   * wait until gameplay is ready
   * interact with the game
   * move the player
   * attack
   * trigger combat
   * capture video clips
4. Save raw video clips into:

```txt
/trailers/raw/
```

5. Use FFmpeg to stitch them into a trailer.

### Strategy B: Existing E2E Capture

If existing e2e tests already launch the game:

1. Add a trailer-specific capture spec.
2. Use e2e video recording.
3. Record several short gameplay segments.
4. Stitch the output with FFmpeg.

### Strategy C: Browser Screen Capture Script

If Playwright video capture is not reliable:

1. Create a local browser recording script if feasible.
2. Use browser APIs, canvas capture, or controlled screen capture where practical.
3. Export clips and stitch with FFmpeg.

### Strategy D: Last Resort

If true video capture is impossible in the current environment:

1. Generate a trailer assembly script anyway.
2. Generate title cards and overlay assets.
3. Generate a documented capture script.
4. Explain exactly what environmental limitation prevented final export.
5. Do not pretend the final video was created.

---

## Trailer Creative Direction

The trailer should feel like:

* dark fantasy
* grim
* fast
* readable
* indie roguelite
* top-down action
* “one more run”
* Limbo / damned souls / trial by combat

Avoid making it too slow or too text-heavy.

The trailer should focus on:

* movement
* combat
* enemies
* attacks
* upgrades
* boss/elite moments if available
* dark atmosphere
* title/logo
* replayability

---

## Suggested Trailer Structure

Create a rough edit following this structure if the game has enough footage.

### 0–3 seconds: Hook

Black fade-in or dark gameplay shot.

Text overlay:

```txt
DEATH WAS ONLY THE BEGINNING
```

### 3–8 seconds: Establish the Game

Show the player in Limbo, moving through the environment.

Text overlay:

```txt
ENTER LIMBO
```

### 8–18 seconds: Combat Montage

Show fast gameplay:

* movement
* dodging
* attacking
* enemy swarms
* hit flashes
* projectiles
* damage effects

Text overlay:

```txt
SURVIVE THE TRIAL
```

### 18–26 seconds: Build/Upgrade Moment

If an upgrade screen, item pickup, weapon change, class choice, or power spike exists, show it.

Text overlay:

```txt
BUILD YOUR RUN
```

### 26–36 seconds: Escalation

Show:

* stronger enemies
* boss or elite enemy if available
* heavy attack effects
* intense combat

Text overlay:

```txt
FACE THE DAMNED
```

### 36–45 seconds: End Card

Show logo/title.

Text:

```txt
EVERLASTING OBLIVION: LIMBO TRIAL
```

Optional final line, depending on what exists in the project:

```txt
DEMO COMING SOON
```

or

```txt
PLAY THE TRIAL
```

or

```txt
WISHLIST SOON
```

Do not claim “Wishlist now” unless there is an actual Steam page or store page in the project documentation.

---

## Gameplay Capture Requirements

Capture multiple short raw clips, not one long unedited clip.

Try to capture at least:

```txt
/trailers/raw/clip-01-intro.webm
/trailers/raw/clip-02-movement.webm
/trailers/raw/clip-03-combat.webm
/trailers/raw/clip-04-upgrade.webm
/trailers/raw/clip-05-escalation.webm
/trailers/raw/clip-06-finale.webm
```

If exact names/formats differ because of tooling, that is fine, but keep the structure organized.

Use automation to make gameplay look as good as possible:

* Move the character intentionally.
* Avoid staring at empty rooms.
* Avoid long dead time.
* Prefer active combat moments.
* Prefer readable shots.
* Avoid showing obvious bugs unless unavoidable.
* Hide debug UI if there is an existing safe way to do so.
* Use a clean browser viewport.
* Prefer 1920×1080 landscape output.
* If the game itself is lower resolution, scale cleanly.

---

## Video Output Requirements

Final video:

```txt
/trailers/everlasting-oblivion-limbo-trial-trailer.mp4
```

Preferred technical specs:

* 1920×1080
* 30fps or 60fps
* H.264 MP4
* AAC audio if audio is included
* Reasonable bitrate
* playable in normal media players
* no giant file size unless unavoidable

Also create a thumbnail frame if practical:

```txt
/trailers/thumbnail.png
```

And optionally a short version:

```txt
/trailers/everlasting-oblivion-limbo-trial-short.mp4
```

---

## FFmpeg Editing Requirements

Use FFmpeg for as much as possible:

* trimming
* joining clips
* fade in/out
* scaling
* text overlays
* title cards
* audio mixing if audio exists
* final export

Create reusable scripts:

For Windows/PowerShell:

```txt
/scripts/trailer/create-trailer.ps1
```

If appropriate, also create a cross-platform script:

```txt
/scripts/trailer/create-trailer.mjs
```

The scripts should be documented and safe to rerun.

---

## Text Overlay Style

Use simple, readable trailer text.

Avoid clutter.

Use short phrases:

```txt
DEATH WAS ONLY THE BEGINNING
ENTER LIMBO
SURVIVE THE TRIAL
BUILD YOUR RUN
FACE THE DAMNED
EVERLASTING OBLIVION: LIMBO TRIAL
```

Use no more than 1–2 lines at a time.

Do not cover important gameplay.

If font choice is available, use something bold, readable, and gothic/dark-fantasy only if it remains readable.

If no custom font is available, use default FFmpeg/system fonts.

---

## Audio Requirements

Use this order of preference:

1. Existing in-game music and SFX if available and safe.
2. Existing project-owned trailer music if available.
3. Programmatically generated dark ambient audio bed.
4. Silence, if audio generation is not feasible.

Do not use copyrighted tracks.

If generating simple audio, keep it subtle:

* low drone
* heartbeat-like pulse
* dark ambience
* simple impact hits at text/title moments

The trailer should still work without audio, but audio is preferred.

---

## Quality Bar

The finished trailer should not be perfect, but it should be good enough to judge.

Minimum acceptable trailer:

* Opens with a title/hook
* Shows real gameplay
* Shows combat
* Has at least 3 distinct visual moments
* Has readable text overlays
* Ends with the game title
* Exports successfully as MP4

Better trailer:

* Has good pacing
* Has enemy variety
* Has upgrade/build moment
* Has boss/elite tease
* Has music/SFX
* Has thumbnail
* Has short social cut

---

## What Not To Do

Do not:

* generate fake gameplay using AI video tools
* use copyrighted music
* require the user to manually record footage
* leave behind only instructions without trying to automate
* make invasive architecture changes
* break normal game startup
* permanently alter balancing just for the trailer
* claim success if no `.mp4` exists
* spend time polishing unrelated gameplay systems
* refactor the whole project
* implement `trailerMode` unless needed

---

## If Gameplay Is Too Random or Too Boring

Try to improve the capture through automation first:

* restart until enemies spawn
* move toward enemies
* use attack input repeatedly
* choose a more advanced save/state if one exists
* use existing debug/dev shortcuts if documented
* use existing seed controls if available
* use existing level selection if available
* use existing cheats only if they already exist and do not affect production builds

Do **not** implement a full trailer mode yet.

If the current game cannot reliably produce exciting footage, document that clearly in:

```txt
/trailers/TRAILER_CREATION_REPORT.md
```

Then recommend the next step:

```txt
Implement a dev-only trailerMode flag with deterministic showcase scenes.
```

But do not jump to that unless normal automated capture fails.

---

## Deliverables

By the end, produce as many of these as possible:

Required:

```txt
/trailers/everlasting-oblivion-limbo-trial-trailer.mp4
/trailers/TRAILER_CREATION_REPORT.md
```

Strongly preferred:

```txt
/trailers/raw/
/scripts/trailer/create-trailer.ps1
/trailers/thumbnail.png
```

Optional:

```txt
/trailers/everlasting-oblivion-limbo-trial-short.mp4
/scripts/trailer/create-trailer.mjs
/scripts/trailer/capture-trailer.mjs
```

---

## Final Response Format

When finished, respond with:

```txt
Trailer automation complete.

Created:
- [list actual files created]

How to view:
- [path to final mp4]

How to regenerate:
- [exact command]

Notes:
- [brief limitations, if any]
```

If the trailer could not be exported, respond with:

```txt
Trailer automation attempted, but final MP4 export did not complete.

What worked:
- [...]

What failed:
- [...]

Files created:
- [...]

Next recommended step:
- Implement a dev-only trailerMode flag with deterministic showcase scenes.
```

Do not say the work is complete unless the final trailer file actually exists.

---

## Success Criteria

The task is successful only if:

* The game was inspected.
* A real capture attempt was made.
* A final MP4 trailer was created, or the exact blocker was documented.
* The process is repeatable.
* The user does not need to manually edit footage.
* Normal gameplay is not broken.
