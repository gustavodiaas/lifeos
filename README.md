# LifeOS

[Português (Brasil)](README.pt-BR.md)

LifeOS is an open-source personal operations system for connecting goals, projects, tasks, habits, calendar events, notes, journaling, and personal finances in one place.

> [!IMPORTANT]
> LifeOS is in an early stage and is currently being reorganized. Some modules use Supabase, while others still store data only in the browser. Review [the current architecture](docs/ARCHITECTURE.md) before using it with important or sensitive data.

## Why LifeOS?

Most productivity tools split planning, execution, and reflection across unrelated apps. LifeOS is evolving toward a single workflow:

**Goals → projects → tasks → calendar → daily execution → weekly review**

Supporting modules such as habits, notes, journaling, health metrics, and finances provide context to that workflow instead of becoming isolated dashboards.

## Current features

- Personal dashboard and quick capture actions
- Projects and tasks with priorities, status, tags, and checklists
- Goals and progress tracking
- Habit tracking and streaks
- Calendar and reminders
- Notes, folders, backlinks, study tools, and book tracking
- Journal and mood history
- Personal metrics and statistics
- Income and expense tracking
- Shopping lists and savings goals
- Authentication and cloud-backed modules through Supabase
- Installable progressive web app (PWA)
- Light, dark, and system themes

## Technology

- React 19 and TypeScript
- TanStack Start, Router, and Query
- Vite 8
- Tailwind CSS 4 and Radix UI
- Supabase Auth, Database, Storage, and Realtime
- React Hook Form and Zod
- Recharts
- Vite PWA

## Demo

The current public deployment is available at [lifeos-omega-three.vercel.app](https://lifeos-omega-three.vercel.app/). An account is required to access the application.

## Getting started

### Requirements

- [Bun](https://bun.sh/) — the repository lockfile is maintained with Bun
- A Supabase project

### Installation

```bash
git clone https://github.com/gustavodiaas/lifeos.git
cd lifeos
bun install
cp .env.example .env.local
```

On Windows PowerShell, replace the last command with:

```powershell
Copy-Item .env.example .env.local
```

Fill in the environment variables using the values from your Supabase project, then start the development server:

```bash
bun run dev
```

The terminal will show the local URL.

## Environment variables

| Variable                 | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Public URL of the Supabase project                            |
| `VITE_SUPABASE_ANON_KEY` | Legacy client-side public key used by the current application |

Never expose a Supabase `service_role` or secret key in a `VITE_` environment variable. Browser variables are included in the client bundle. Migration to the newer Supabase publishable-key naming is tracked in the roadmap.

## Available commands

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `bun run dev`       | Start the development server        |
| `bun run build`     | Create a production build           |
| `bun run build:dev` | Create a development-mode build     |
| `bun run preview`   | Preview the production build        |
| `bun run lint`      | Run ESLint                          |
| `bun run format`    | Format the repository with Prettier |

## Project structure

```text
src/
├── components/     Shared application and UI components
├── context/        Authentication and workspace state
├── hooks/          Data access and module state
├── lib/            Utilities, types, exports, and Supabase client
├── modules/        Product modules
├── pwa/            Service worker registration
└── routes/         TanStack file-based routes
```

See [Architecture](docs/ARCHITECTURE.md) for the current data boundaries and known limitations.

## Roadmap

The current priorities are:

1. Repository, data-model, and security foundations
2. A consistent, mobile-first visual system
3. A focused daily command center
4. Integrated goals, projects, tasks, calendar, and habits
5. Guided weekly planning and review
6. Optional, privacy-conscious AI assistance

The detailed sequence is available in [Roadmap](docs/ROADMAP.md).

## Contributing

Contributions and thoughtful feedback are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please use GitHub Issues for reproducible bugs and focused feature proposals.

For vulnerabilities or privacy concerns, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## License

LifeOS is available under the [MIT License](LICENSE).
