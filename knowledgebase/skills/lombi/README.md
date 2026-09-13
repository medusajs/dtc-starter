# Lombiq Orchard Core Agent Skills

> Source: https://github.com/Lombiq/Orchard-Core-Agent-Skills (branch: `dev`)

This repository contains [agent skills](https://agentskills.io/home) for Orchard Core development tasks. Orchard Core is an open-source, modular, and multi-tenant application framework and CMS built on .NET and ASP.NET Core.

> **Note**: This skill is for Orchard Core (.NET CMS), not directly related to this Payload/Next.js project. Included for reference/cross-training.

## Requirements

- Any agent that supports agent skills.
- For one-command installation with `npx skills add`, install Node.js.
- Python 3.8+ for sync scripts.

## Skills Included

### `orchard-core-theming`

A playbook covering common Orchard Core theme development tasks, including shape development and recipe management.

#### What's in this skill

- Task-focused references for shape discovery, alternates, placement rules, and template implementation
- Separate Razor and Liquid guidance with practical examples
- Content-model access workflows (content definitions, field/part models, sample content inspection)
- Recipe authoring patterns for content definitions, sample content, roles, users, and site settings
- A sync script and maintenance workflow for keeping generated references up to date

#### Highlights

- Creates and implements ad-hoc shape templates or override content templates using the correct alternates
- Can use common tag helpers, Liquid filters, and `IOrchardHelper` extensions in templates
- Reads content definitions via `ContentDefinition.json` or directly from the SQLite database
- Accesses all relevant content models for content items and fields, including parts like `BagPart` and `FlowPart`
- Can manage recipes using common recipe steps

## Installation

```bash
npx skills add Lombiq/Orchard-Core-Agent-Skills
```

For manual installation, copy the `skills/` subfolders into your agent's skills directory:
- Project scope: `.github/skills/` (Copilot), `.codex/skills/` (Codex), `.claude/skills/` (Claude Code)
- Global scope: `~/.copilot/skills/`, `~/.codex/skills/`, `~/.claude/skills/`

## License

BSD-3-Clause — Developed by [Lombiq Technologies](https://lombiq.com/).
