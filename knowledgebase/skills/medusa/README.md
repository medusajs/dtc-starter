# MedusaJS AI Skills

> Source: https://github.com/medusajs/medusa-agent-skills

Official MedusaJS agent skills and commands for building Medusa applications with best practices and architectural patterns. These skills can be used with Claude Code, Cursor, and other AI coding assistants.

## Plugins

### medusa-dev
Comprehensive skills for building Medusa applications across backend, admin UI, and storefronts.

Skills included:
- `building-with-medusa` - Backend development (modules, workflows, API routes)
- `building-admin-dashboard-customizations` - Admin UI development (widgets, pages, forms)
- `building-storefronts` - Storefront integration (SDK usage, React Query patterns)
- `creating-internal-agents` - Creating internal admin-facing AI agents
- `db-generate` - Generate database migrations for a Medusa module
- `db-migrate` - Run database migrations in Medusa
- `new-user` - Create an admin user in Medusa

### learn-medusa
Interactive tutorial session to learn Medusa concepts through building a brands feature.

Skills included:
- `learning-medusa` - Interactive guided tutorial where Claude acts as instructor

### ecommerce-storefront
Comprehensive skill for building high-converting ecommerce storefronts with best practices.

Skills included:
- `storefront-best-practices` - Framework-agnostic storefront patterns (Next.js, SvelteKit, TanStack Start)

### medusa-cloud
Skills for managing Medusa Cloud resources through the Cloud CLI (mcloud).

## Installation

### Claude Code
```bash
/plugin marketplace add medusajs/medusa-agent-skills
/plugin install medusa-dev@medusa
```

### Other AI Agents
```bash
npx skills add medusajs/medusa-agent-skills
```

## MCP Server

Medusa also provides an MCP remote server at `https://docs.medusajs.com/mcp` for querying Medusa documentation directly from your AI assistant.

```bash
claude mcp add --transport http medusa https://docs.medusajs.com/mcp
```
