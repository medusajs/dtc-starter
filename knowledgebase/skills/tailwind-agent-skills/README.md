# Lombiq Tailwind Agent Skills

> Source: https://github.com/Lombiq/Tailwind-Agent-Skills (branch: `dev`)

Agent-optimized Tailwind CSS v4 documentation skill with local snapshots and indexing.

This repository contains agent skills for Tailwind v4 development tasks. With these skills, you can use your favorite agent efficiently for Tailwind v4 usage, configuration, and migration questions, and initialize a local docs snapshot after installation.

## Requirements

- Any agent that supports agent skills.
- For one-command installation with `npx skills add`, install Node.js.
- Python 3.8+ for sync scripts (used for the docs snapshot generator).

## Skills Included

### `tailwind-4-docs`

An agent-optimized workflow for Tailwind CSS v4 documentation, including a curated gotchas list, an implementation playbook, and a local docs snapshot generator.

#### Highlights

- Mirrors the official Tailwind docs structure so agents can load only what they need after initialization
- Generates `docs-index.tsx` locally to map categories and slugs to MDX files
- Includes an agent-oriented engineering playbook for implementation, refactor, and review tasks
- Provides a sync script that can initialize and refresh references after installation
- Does not bundle the Tailwind docs themselves due to upstream licensing

#### Initialization

**IMPORTANT**: Initialize the docs snapshot after installation. Run:
```bash
python skills/tailwind-4-docs/scripts/sync_tailwind_docs.py --accept-docs-license
```

The script clones `tailwindcss.com` into a temporary folder, then copies:
- `src/docs/` to `skills/tailwind-4-docs/references/docs/`
- `src/docs/docs-index.tsx` to `skills/tailwind-4-docs/references/docs-index.tsx`

#### License Note

The Tailwind docs repo is source-available and explicitly not open source. This repository does not redistribute the docs. Users are responsible for accepting the upstream license before downloading the snapshot.

## Installation

```bash
npx skills add Lombiq/Tailwind-Agent-Skills
```

For manual installation, copy the `skills/` subfolders into your agent's skills directory:
- Project scope: `.github/skills/` (Copilot), `.codex/skills/` (Codex), `.claude/skills/` (Claude Code)
- Global scope: `~/.copilot/skills/`, `~/.codex/skills/`, `~/.claude/skills/`

## License

BSD-3-Clause — Developed by [Lombiq Technologies](https://lombiq.com/).
