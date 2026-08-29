# Vvfx game effects

Export **Runtime JSON** from Vvfx and place it in this directory using a stable
file name:

```text
chain-lightning.vvfx-runtime.json
tesla-chain-link.vvfx-runtime.json
meteor-strike.vvfx-runtime.json
```

The file-name stem is the gameplay effect ID. Tesla Coil owns `chain-lightning`
for its player-to-first-target attack and `tesla-chain-link` for subsequent
enemy-to-enemy hops. Files are discovered, validated, and have their embedded
images preloaded automatically. Meteor Hammer owns the point-placed
`meteor-strike` effect and resolves its gameplay impact at the export's 450 ms
flash/ring moment. Replacing a stable JSON file updates its visual without a new
import or per-effect helper.

Point effects work with `spawnAt`. `spawnBetween` fits exports containing Beam
layers to its two world-space endpoints. An export without Beam layers is not
silently stretched: it produces one development warning and plays unchanged at
the segment midpoint as a safe visual fallback.
