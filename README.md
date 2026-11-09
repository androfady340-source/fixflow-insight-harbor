# FixFlow

FixFlow is a workflow-improvement tool for small businesses. It turns a description of an operational problem into a structured analysis, proposed workflow, practical recommendations, and an actionable task list.

**Live app:** https://fixflow-insight-harbor.lovable.app

## Core capabilities

- Secure account access with email/password and Google sign-in.
- Guided four-step intake for business context, workflow problems, operating volume, team size, and current tools.
- AI-assisted workflow analysis with structured output and validation.
- Current and recommended workflow diagrams.
- Project status tracking and editable workflows.
- Task lists with priorities, owners, due dates, and completion states.
- Printable analysis report.
- Per-account project and task isolation enforced by Supabase Row Level Security.

## Technology

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Supabase Auth and PostgreSQL with Row Level Security
- Lovable AI Gateway
- React Flow (@xyflow/react)
- Tailwind CSS and Radix UI
- Vitest, ESLint, and Prettier
- Nitro with Cloudflare-oriented build configuration

## Local development

### Requirements

- Bun (the repository includes `bun.lock`)
- A Supabase project with the database migration applied
- Lovable AI Gateway credentials/configuration for live AI analysis

### Install

```bash
git clone https://github.com/androfady340-source/fixflow-insight-harbor.git
cd fixflow-insight-harbor
bun install --frozen-lockfile
```

### Environment

Copy `.env.example` to `.env` and fill in the values from your Supabase project.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase URL used by the browser |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public/publishable Supabase key used by the browser |
| `SUPABASE_URL` | Supabase URL used by server-side requests |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key used by server-side authenticated requests |

The server-only helper in `src/integrations/supabase/client.server.ts` can use `SUPABASE_SERVICE_ROLE_KEY` for trusted administrative operations. It is not required by the current analysis flow. If you enable a server operation that needs it, configure it only as a server secret. Never use it in browser code or expose it through a `VITE_` variable.

### Database

Apply the SQL files in `drizzle/migrations/` to the Supabase project in numerical order. The initial migration creates profiles, projects, tasks, and analysis-run records with Row Level Security policies.

### Run

```bash
bun run dev
```

Vite prints the local development URL in the terminal.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run lint` | Run ESLint |
| `bun run test` | Run the Vitest test suite |
| `bun run build` | Create a production build |
| `bun run preview` | Preview the production build |
| `bun run format` | Format source files with Prettier |

## Security notes

- Keep local environment files out of Git. Only `.env.example` belongs in version control.
- Browser builds may contain the Supabase publishable key; database access must remain protected by RLS.
- Keep service-role credentials server-side only.
- Analysis generation requires an authenticated user and verifies project access through Supabase.
- Apply all database migrations before deploying the matching application version.

## Project structure

```text
src/
  components/             UI and workflow editor components
  integrations/supabase/  Supabase clients and auth middleware
  lib/                    Queries, analysis logic, and validation
  routes/                 TanStack file-based routes
  test/                   Automated tests
drizzle/migrations/       SQL schema and security migrations
public/                   Static assets
```

## Maintainer

Andro Fady — [GitHub](https://github.com/androfady340-source)
