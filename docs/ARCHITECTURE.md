# Architecture

This document describes the current repository rather than the intended final architecture.

## Application structure

LifeOS is a TypeScript application built with React and TanStack Start. File-based routes live in `src/routes`, product areas in `src/modules`, shared components in `src/components`, and data-access hooks in `src/hooks`.

The browser initializes a Supabase client from two public environment variables in `src/lib/supabase.ts`. Authentication state is provided by `AuthContext`, while most cloud-backed product modules query Supabase directly through hooks.

## Current data boundaries

Persistence is not yet uniform. The following table records the current implementation so contributors do not assume that every module is cloud-synchronized.

| Area                              | Current persistence       | Notes                                                           |
| --------------------------------- | ------------------------- | --------------------------------------------------------------- |
| Authentication and profile        | Supabase                  | Auth plus profile and avatar data                               |
| Projects and tasks                | Supabase                  | Queried through `useTasks`                                      |
| Goals                             | Supabase                  | Queried through `useGoals`                                      |
| Habits and logs                   | Supabase                  | Queried through `useHabits`                                     |
| Notes, folders, and links         | Supabase                  | Queried through `useNotes`                                      |
| Journal                           | Supabase                  | Queried through `useJournal`                                    |
| Personal metrics                  | Supabase                  | Queried through `useMetrics`                                    |
| Financial transactions            | Supabase                  | Stored in `lancamentos`                                         |
| Calendar                          | Mixed                     | Supabase with browser-storage fallback                          |
| Books                             | Mixed                     | Both a Supabase hook and a browser-storage implementation exist |
| Shopping lists                    | Browser storage           | Device/browser specific                                         |
| Investments and savings boxes     | Browser storage           | Device/browser specific                                         |
| Health display preferences        | Browser storage           | Device/browser specific                                         |
| Workspace sharing and invitations | Browser storage prototype | Not a server-authorized collaboration system                    |

## Supabase tables referenced by the client

The current source references these tables:

- `profiles`
- `projects`
- `tasks`
- `goals`
- `habits`
- `habit_logs`
- `notes`
- `folders`
- `note_links`
- `journal_entries`
- `metrics`
- `lancamentos`
- `books`
- `calendar_events`

This list documents client expectations; it is not a database migration. The production schema and Row Level Security policies are not currently versioned in this repository.

## Known architectural limitations

- Cloud and browser-only persistence produce different behavior across modules and devices.
- Database types are handwritten and contain both `snake_case` and `camelCase` representations.
- The production database schema and Row Level Security policies cannot be audited from the repository.
- Workspace invitations, public links, and permissions are currently client-side prototypes, not secure collaboration boundaries.
- Backup export covers only part of the data model, and import needs stricter schema and table validation.
- The service worker applies broad runtime caching to Supabase requests; this must be reviewed before the app is recommended for sensitive data.
- There is no automated test suite yet.

## Target direction

The intended structure is:

1. Version the database schema, migrations, generated types, and explicit ownership policies.
2. Centralize data access and mapping so UI components use one consistent TypeScript model.
3. Clearly separate cloud-synchronized features from intentional offline-only storage.
4. Replace prototype collaboration with server-authorized membership, signed invitations, expiration, and audited permissions—or remove it until that work is complete.
5. Add unit, integration, Row Level Security, and critical user-flow tests.
6. Review PWA caching rules so authenticated personal data is not stored by a broad runtime cache.

Architecture changes involving user data should include a migration plan and an explanation of privacy and security impact.
