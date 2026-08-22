# Playtest Data

This folder is the local home for Limbo Trial run reports. You do not need to
manage it during an ordinary playtest.

## The Simple Workflow

1. Start the game with `npm run dev`.
2. Finish or end a run normally.
3. On the result screen, look for `AUTO-SAVED: playtest-data/runs/...`.
4. Ask an AI agent to read `playtest-data/index.csv` and inspect the relevant
   files under `playtest-data/runs/`.

That is all that is required. The local development server creates three ignored
files automatically:

- `runs/*.json`: one complete, readable report per run;
- `index.csv`: a small comparison table with one row per run;
- `runs.jsonl`: every complete report in an AI-friendly batch format.

The generated data stays on this computer. It is not uploaded to Supabase and is
not committed to Git by default.

## Result-Screen Backups

Every result screen also has two manual options:

- **Copy JSON** puts the complete report on the clipboard so it can be pasted
  directly into an AI conversation.
- **Download JSON** saves a descriptively named file through the browser.

If the automatic save line says it failed, use **Download JSON**. Nothing else about
the run is affected.

## Rebuild The Index

If JSON files are added to `playtest-data/runs/` manually, rebuild the comparison
files with:

```powershell
npm run runs:index
```

The indexer accepts both automatically saved records and the raw JSON produced by
the Download button. Invalid JSON files are skipped rather than stopping the
entire index.

## Useful Request For An AI Agent

```text
Read playtest-data/README.md and playtest-data/index.csv. Compare the latest runs,
then inspect the relevant JSON files under playtest-data/runs/ and report balance,
weapon, character, curse, Warden, and death-source patterns.
```
