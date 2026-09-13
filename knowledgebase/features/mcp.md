# MedusaJS MCP (Model Context Protocol) — Guide for AI-Assisted Development

## What is MCP?

**Model Context Protocol (MCP)** is an open standard (by Anthropic) that lets AI agents connect to external tools, data sources, and documentation servers in a standardized way. Instead of an AI relying on its training data (which may be stale or incomplete), MCP gives it live, structured access to authoritative sources.

For MedusaJS, this means an AI agent (Claude Code, Cursor, VS Code Copilot, etc.) can:
- Query the **official Medusa documentation** in real time
- **Execute Medusa admin API operations** directly (create products, manage orders, etc.)
- Follow step-by-step implementation guides for common tasks

**No Medusa Cloud account is required** for any of this. Multiple open-source options exist.

---

## MCP Options for Medusa

There are **four approaches** to using MCP with Medusa, ordered by practicality for your setup:

### Option 1: `mcp-medusa` (Recommended for Local Dev)

A comprehensive community-built MCP server that exposes **200+ Medusa admin API actions** as MCP tools. It connects directly to your running Medusa backend — no docs scraping, no Cloud account.

**Repo:** https://github.com/matiasscovotti2/mcp-medusa (also mirrored at https://github.com/minimalart/mcp-medusa)

**What it does:**
- Full CRUD for products, orders, customers, collections, promotions, etc.
- Advanced operations: fulfillment, order edits, inventory management
- Works with Claude Desktop, Windsurf, Cursor, and any MCP-compatible IDE
- Runs locally via stdio (npx) or remotely via HTTP

**Requirements:**
- Node.js v20+
- A running Medusa backend (your local `http://localhost:9000`)
- A Medusa admin API key

**Local setup (stdio mode):**
```bash
# No clone needed — runs directly via npx
npx -y mcp-medusa
```

**Claude Desktop config** (`%APPDATA%\Claude\claude_desktop_config.json` on Windows):
```json
{
  "mcpServers": {
    "medusa-admin": {
      "command": "npx",
      "args": ["-y", "mcp-medusa"],
      "env": {
        "MEDUSA_BASE_URL": "http://localhost:9000",
        "MEDUSA_API_KEY": "sk_admin_xxxxxxxxxxxx"
      }
    }
  }
}
```

**Cursor config** (`.cursor/mcp.json` in your project):
```json
{
  "mcpServers": {
    "medusa-admin": {
      "command": "npx",
      "args": ["-y", "mcp-medusa"],
      "env": {
        "MEDUSA_BASE_URL": "http://localhost:9000",
        "MEDUSA_API_KEY": "sk_admin_xxxxxxxxxxxx"
      }
    }
  }
}
```

**VS Code config** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "medusa-admin": {
      "command": "npx",
      "args": ["-y", "mcp-medusa"],
      "env": {
        "MEDUSA_BASE_URL": "http://localhost:9000",
        "MEDUSA_API_KEY": "sk_admin_xxxxxxxxxxxx"
      }
    }
  }
}
```

**How to get your admin API key:**
1. Open Medusa Admin at `http://localhost:9000/app`
2. Go to **Settings → API Keys**
3. Create a new key with admin permissions
4. Copy the token (starts with `sk_admin_`)

**This is the most powerful option** — it doesn't just answer questions, it can actually manipulate your Medusa backend.

---

### Option 2: `medusa-plugin-mcp` (Embedded in Backend)

A Medusa plugin that adds an MCP server **directly inside your Medusa backend** and provides an admin chat UI for conversing with an LLM that has access to your store's data and operations.

**Repo:** https://github.com/pevey/medusa-plugins
**Docs:** https://pevey.com/medusa-plugin-mcp/

**What it does:**
- MCP server runs inside the Medusa backend process
- Exposes Medusa data and operations as MCP tools
- Admin chat UI built into the Medusa Admin dashboard
- Package-based tool discovery — installed plugins can contribute their own tools
- Module service backing chat sessions and tool execution

**Setup:**
```bash
cd apps/backend
pnpm add medusa-plugin-mcp
```

Enable in `apps/backend/medusa-config.ts`:
```ts
module.exports = defineConfig({
  // ... your existing config
  plugins: [
    {
      resolve: "medusa-plugin-mcp",
      options: {}
    }
  ]
})
```

Then open the Medusa Admin → you'll see a chat UI where you can interact with an LLM that has direct access to your store's data.

**This is the best option if you want MCP tools embedded in production** — the AI can query your actual store data, manage orders, etc., all from within the admin panel.

---

### Option 3: `Alexcs24/Medusa.js-Documentation-MCP-Server` (Local Docs Search)

A self-hosted MCP server that bundles the entire Medusa v2 documentation (4.7MB text file) and provides fuzzy search through 2,105+ documentation sections. Zero external dependencies, no Cloud, no backend needed.

**Repo:** https://github.com/alexcs24/Medusa.js-Documentation-MCP-Server

**What it does:**
- Fuzzy search through all Medusa v2 docs
- Precise lookup by title or path
- List all available sections
- Docs are included in the repo — no network calls to docs.medusajs.com
- Always up-to-date with the bundled doc version

**Setup:**
```bash
git clone https://github.com/alexcs24/Medusa.js-Documentation-MCP-Server.git
cd Medusa.js-Documentation-MCP-Server
npm install
```

The docs are at `./docs/medusa-docs.txt` (4.7MB, bundled). You can replace them with newer docs from `https://docs.medusajs.com/llms-full.txt` if needed.

**Cursor config** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "medusa-docs": {
      "command": "node",
      "args": ["/absolute/path/to/Medusa.js-Documentation-MCP-Server/dist/index.js"],
      "env": {
        "MEDUSA_DOCS_PATH": "/absolute/path/to/Medusa.js-Documentation-MCP-Server/docs/medusa-docs.txt"
      }
    }
  }
}
```

**VS Code config** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "medusa-docs": {
      "command": "node",
      "args": ["/absolute/path/to/Medusa.js-Documentation-MCP-Server/dist/index.js"],
      "env": {
        "MEDUSA_DOCS_PATH": "/absolute/path/to/Medusa.js-Documentation-MCP-Server/docs/medusa-docs.txt"
      }
    }
  }
}
```

**Good for:** Pure documentation lookup when you don't need to execute API operations.

---

### Option 4: `llms.txt` + Generic MCP Server (Lightest Weight)

Medusa publishes its full documentation as a single text file at `https://docs.medusajs.com/llms-full.txt`. You can feed this into any generic `llms.txt`-compatible MCP server like `mcpdoc` (by LangChain).

**How it works:**
1. `mcpdoc` fetches the `llms.txt` index from Medusa's docs
2. When you ask a question, it fetches the relevant doc page
3. No Cloud account, no local server process beyond the generic MCP doc server

**Setup with `mcpdoc`:**
```bash
# Install the generic llms.txt MCP server
uvx --from mcpdoc mcpdoc \
  --urls "Medusa:https://docs.medusajs.com/llms.txt" \
  --transport stdio
```

**Cursor config:**
```json
{
  "mcpServers": {
    "medusa-docs": {
      "command": "uvx",
      "args": [
        "--from", "mcpdoc", "mcpdoc",
        "--urls", "Medusa:https://docs.medusajs.com/llms.txt",
        "--transport", "stdio"
      ]
    }
  }
}
```

**Claude Code:**
```bash
claude mcp add-json medusa-docs '{
  "type": "stdio",
  "command": "uvx",
  "args": [
    "--from", "mcpdoc", "mcpdoc",
    "--urls", "Medusa:https://docs.medusajs.com/llms.txt",
    "--transport", "stdio"
  ]
}'
```

**Note:** This fetches docs live from `docs.medusajs.com`. If you want fully offline docs, download `llms-full.txt` and point `mcpdoc` at a local file path.

---

## The Official Medusa MCP Server (Cloud-Gated)

For completeness: Medusa **does** host an official remote MCP server at `https://docs.medusajs.com/mcp`. It provides the `ask_medusa_question` tool plus specialized guide tools (`get_product_custom_data_guide`, `get_payment_provider_integration_guide`, `get_fulfillment_provider_integration_guide`).

**However, this server requires a Medusa Cloud account.** It's the only option that requires Cloud. The three open-source options above cover all the same use cases without any Cloud dependency.

---

## How Kilo Uses MCP for This Project

Once an MCP server is connected, here's how Kilo leverages it when working on the `medusa-js` project:

### With `mcp-medusa` (API-level MCP)
- **Create/modify products, orders, customers** directly through the AI agent
- **Query real backend data** — not stale training data
- **Execute workflows** — the agent can run actual Medusa operations
- **Manage regions, shipping, promotions** — full admin API coverage

### With `medusa-plugin-mcp` (embedded in backend)
- **In-admin chat** — ask questions about your store's actual data
- **Plugin-contributed tools** — other Medusa plugins can expose their own MCP tools
- **Production-ready** — the MCP server runs as part of your backend

### With docs-only MCP servers (`Alexcs24` or `llms.txt`)
- **Accurate API documentation** — Kilo queries live/current docs, not training data
- **Correct config options** — exact `medusa-config.ts` keys, env vars, etc.
- **Step-by-step guides** — for extending products, integrating providers, etc.

### With codebase-context MCP servers (`PatrickSys/codebase-context`, `CodeAlive`, etc.)
- **Semantic code search** — Kilo can find relevant code by meaning, not just filenames
- **Architecture understanding** — the agent learns your project's patterns, conventions, and module boundaries
- **Reduced token usage** — semantic search reduces the number of tokens needed to locate the right code
- **Faster edits** — the agent spends less time reading unrelated files and more time making correct changes
- **Cross-session memory** — some MCP servers persist project knowledge across conversations, so Kilo doesn't have to re-discover the same patterns every session

## Why MCP Matters for This Project

### Problems MCP Solves

Without MCP, Kilo operates primarily from training data and the files it can read in your repo. That works, but it has limits:

| Problem | How MCP Helps |
|---|---|
| **Stale docs** | MCP docs servers return current Medusa docs, not cutoff-trained snippets |
| **Backend blindness** | `mcp-medusa` lets Kilo query and mutate real store data instead of guessing |
| **Codebase sprawl** | A codebase-context MCP server gives semantic search across `apps/backend` and `apps/storefront`, so Kilo finds the right module/workflow/component faster |
| **Repetition across sessions** | Persistent memory MCP servers remember architecture decisions and conventions between conversations |
| **Token waste** | Semantic retrieval replaces broad file reads with targeted context, lowering cost and latency |

### What Gets Faster With MCP Enabled

- **Understanding the backend**: Kilo can look up exact workflow names, module links, and API shapes from live docs instead of scanning multiple files.
- **Making storefront edits**: Kilo can verify component paths, layout inheritance, and Medusa UI token names from the actual codebase instead of relying on memory.
- **Adding features end-to-end**: With `mcp-medusa`, Kilo can create a product in the admin, verify it in the storefront, and adjust the UI in one flow without manual copy-paste.
- **Debugging**: Kilo can inspect real orders, cart state, and customer data to diagnose issues instead of asking you to paste logs.

### Recommended MCP Stack for `medusa-js`

For this project, the practical setup is:

1. **`mcp-medusa`** — gives Kilo live admin API access to your backend at `http://localhost:9000`
2. **Medusa Agent Skills** — encodes Medusa conventions into Kilo's prompts
3. **Optional: codebase-context MCP** — improves Kilo's ability to search and understand your local repo efficiently

You do **not** need Medusa Cloud for any of this. All options above run locally or connect to your existing local backend.

---

## Medusa Agent Skills (Claude Code Plugins)

Regardless of which MCP server you use, you should also install the **Medusa Agent Skills** — markdown-based instruction files that encode Medusa best practices directly into the AI agent.

**Repo:** https://github.com/medusajs/medusa-agent-skills

### Available Plugins

| Plugin | What it covers |
|---|---|
| `medusa-dev` | Backend, admin UI, and storefront development — modules, workflows, API routes, data models, module links, admin widgets, storefront patterns |
| `learn-medusa` | Interactive tutorial — learn Medusa concepts by building a brands feature |
| `ecommerce-storefront` | High-converting storefront patterns and best practices |
| `medusa-cloud` | Medusa Cloud CLI (`mcloud`) skills — only useful if you use Cloud |

### Installing for Claude Code

```bash
claude
/plugin marketplace add medusajs/medusa-agent-skills
/plugin install medusa-dev@medusa
/plugin  # verify medusa-dev is listed under Installed
```

### Installing for Cursor

```bash
yarn skills add medusajs/medusa-agent-skills
# Then add MCP server config to .cursor/mcp.json (see options above)
```

### What Skills Do

Skills are **local markdown files** loaded into the AI agent's context. They encode:
- File conventions (kebab-case, PascalCase types, camelCase functions)
- Architectural rules (business logic in workflows, not routes)
- Code style (no semicolons, double quotes, 2-space indent)
- Common mistakes to avoid
- Verification steps

### Skills + MCP Together

Skills and MCP are complementary:
- **MCP** gives the agent live tools and data
- **Skills** give the agent project-specific rules and patterns

For best results on this project, use both:
1. Connect `mcp-medusa` so Kilo can query your backend and docs
2. Install the `medusa-dev` skill so Kilo follows Medusa conventions

Without skills, MCP gives Kilo raw capability but may produce code that doesn't match your project's architecture. Without MCP, skills give Kilo rules but no live data. Together, they give Kilo both the rules and the data to work effectively.

---

## Recommended Setup for This Project (`medusa-js`)

Given your local setup at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`:

### Project MCP Config Files

This repo now includes ready-to-use MCP config files for Cursor and VS Code:

- `.cursor/mcp.json`
- `.vscode/mcp.json`

Both files include:
- `mcp-medusa` for Medusa docs/API lookup
- `codebase-context` for semantic code search across the repo

**Before using:** replace `sk_admin_xxxxxxxxxxxx` in both files with your actual admin API key from `http://localhost:9000/app` → Settings → API Keys.

### Step 1: Install the MCP servers

```bash
npx -y mcp-medusa
npx -y codebase-context
```

### Step 2: Connect your client

**Cursor:**
Open the project in Cursor. It will auto-detect `.cursor/mcp.json` and prompt you to enable the servers. Accept and restart if prompted.

**VS Code:**
Open the project in VS Code. It will auto-detect `.vscode/mcp.json` and prompt you to enable the servers. Accept and restart if prompted.

**Claude Code:**
```bash
claude mcp add --transport stdio medusa-admin \
  -- npx -y mcp-medusa \
  --env MEDUSA_BASE_URL=http://localhost:9000 \
  --env MEDUSA_API_KEY=sk_admin_xxxxxxxxxxxx

claude mcp add --transport stdio codebase-context \
  -- npx -y codebase-context \
  --env CODEBASE_ROOT=C:/Users/faarh/OneDrive/Documents/latest1/medusa-js
```

### Step 3: Install Medusa Agent Skills (Claude Code)

```bash
claude
/plugin marketplace add medusajs/medusa-agent-skills
/plugin install medusa-dev@medusa
/plugin  # verify it's loaded
```

### Step 4: Verify

Ask Kilo:
```
What patterns does this storefront use for page banners?
```

Kilo should now use the MCP servers to query your actual codebase and return relevant patterns.

---

## What You Can Do With MCP Enabled

| Task | What Kilo Can Do |
|---|---|
| "Create a new product called 'Medusa Hoodie'" | Calls the admin API via MCP — creates product with variants, images, pricing |
| "List all pending orders" | Queries your actual order data from the backend |
| "Add a brand attribute to products" | Calls `get_product_custom_data_guide` (if using official docs MCP) or reads source + scaffolds module with correct link |
| "Integrate Stripe as a payment provider" | Gets the exact integration guide, scaffolds the provider module |
| "How do I add a workflow hook?" | Queries docs for current hook API signatures |
| "Show me today's orders" | Real query against your backend's order data |
| "Create a customer and send them a welcome email" | Executes admin API calls end-to-end |
| "Find where the header component is defined" | Semantic code search across the repo — finds it in `modules/layout/templates/nav/index.tsx` |
| "How does the cart dropdown timer work?" | Reads the actual implementation in `modules/layout/components/cart-dropdown/index.tsx` |
| "What patterns does this storefront use for page banners?" | Searches the codebase for PageBanner usage and conventions |

## Practical Considerations and Potential Issues

### Authentication and Security

- **Admin API key required**: `mcp-medusa` needs an admin API key (`sk_admin_*`) from the Medusa Admin. Store it securely and never commit it.
- **Local only**: For local development, `mcp-medusa` runs via `npx` and connects to `http://localhost:9000`. It does not expose your backend to the internet.
- **No Cloud needed**: All open-source MCP options run entirely on your infrastructure. Your data stays private.

### When MCP Might Cause Issues

| Issue | Cause | Mitigation |
|---|---|---|
| **Slow responses** | MCP server adds latency to every tool call | Use local stdio transport; avoid remote HTTP for local dev |
| **Context bloat** | Too many MCP tools loaded at once | Only connect the MCP servers you need for the current task |
| **Stale cached docs** | Docs MCP servers bundle a snapshot of docs | Periodically refresh the bundled docs or use live-fetching servers |
| **Conflicting instructions** | Skills and MCP servers give different advice | Skills take precedence for project conventions; MCP for live data |
| **Token costs** | MCP tool calls use tokens | Use codebase-context MCP servers to reduce token waste from broad file reads |

### When NOT to Use MCP

- **Simple edits**: For a one-line typo fix, MCP adds overhead. Just edit the file directly.
- **Well-known patterns**: If Kilo already knows the pattern from the project's `AGENTS.md` and `knowledgebase/`, MCP docs lookup is redundant.
- **Offline work**: If your backend isn't running, `mcp-medusa` won't help. Fall back to direct code editing.

---

## Open Source vs Cloud MCP — Summary

| Feature | Official Cloud MCP | `mcp-medusa` | `medusa-plugin-mcp` | Docs-only MCP |
|---|---|---|---|---|
| Requires Medusa Cloud | Yes | No | No | No |
| Docs lookup | Yes | No | No | Yes |
| Admin API operations | No | Yes (200+ tools) | Yes (plugin-based) | No |
| Runs locally | No | Yes (npx) | Yes (in backend) | Yes |
| Production-ready | Yes | Yes | Yes | Yes |
| Free tier available | Cloud free tier | Free (MIT) | Free (MIT) | Free (MIT) |
| Open source | No | Yes | Yes | Yes |

---

## Important Notes

- **You do NOT need Medusa Cloud** to use MCP with Medusa — all the open-source options work with a self-hosted backend
- **The `mcp-medusa` server is the most capable** — it gives the AI actual operational control over your backend, not just doc lookup
- **`medusa-plugin-mcp` is production-ready** — embed it in your backend for an in-admin LLM chat
- **Skills (plugins) are separate from MCP** — they encode best practices as markdown instructions; MCP gives the agent live data/tools. Use both together for best results.
- **The official Medusa MCP server** at `docs.medusajs.com/mcp` does require Cloud auth — it's the only Cloud-gated option
- **Your data stays private** — `mcp-medusa` and `medusa-plugin-mcp` run entirely on your infrastructure; the docs-only servers only fetch public documentation

---

## Quick Reference

| What | Where |
|---|---|
| `mcp-medusa` repo | https://github.com/matiasscovotti2/mcp-medusa |
| `medusa-plugin-mcp` | https://pevey.com/medusa-plugin-mcp/ |
| Docs MCP server | https://github.com/alexcs24/Medusa.js-Documentation-MCP-Server |
| `llms.txt` generic server | `uvx --from mcpdoc mcpdoc --urls "Medusa:https://docs.medusajs.com/llms.txt"` |
| Medusa Agent Skills | https://github.com/medusajs/medusa-agent-skills |
| Medusa full docs (text) | https://docs.medusajs.com/llms-full.txt |
| Local project backend | `http://localhost:9000` |
| Local project admin | `http://localhost:9000/app` |
| Admin API key location | Admin → Settings → API Keys |

---

## Official Resources

- **MCP Server Docs (official, Cloud-gated):** https://docs.medusajs.com/learn/introduction/build-with-llms-ai/mcp-server
- **Agent Skills Docs:** https://docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills
- **Extend Products Guide:** https://docs.medusajs.com/learn/introduction/build-with-llms-ai/mcp-server/extend-products
- **Integrate Providers Guide:** https://docs.medusajs.com/learn/introduction/build-with-llms-ai/mcp-server/integrate-providers
- **Announcing New Prompts (June 2026):** https://medusajs.com/blog/announcing-new-prompts-for-the-medusa-mcp-server
- **MCP Specification:** https://modelcontextprotocol.io
