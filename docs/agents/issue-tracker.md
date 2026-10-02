# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/` (e.g. `.scratch/hiit-rome-v1/`)
- The feature spec (PRD) is `.scratch/<feature-slug>/spec.md`
- Implementation issues are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Each issue starts with `# <NN> — <Title>`, then `**What to build:**`, `**Blocked by:**`, and a `**Status:**` line, followed by an acceptance-criteria checklist
- Triage state is the value on the `**Status:**` line (see `triage-labels.md` for the strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/issues/` using the next free number (creating the directory if needed). A PRD goes in `.scratch/<feature-slug>/spec.md`.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## When work on an issue is finished

Tick the completed checklist items and set `**Status:** resolved (branch <branch>, commit <sha>)`.
