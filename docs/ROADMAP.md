# Roadmap

This roadmap favors a coherent and trustworthy core product over adding more disconnected modules. It does not represent release dates or commitments.

## Phase 1 — Repository and trust foundation

- [x] Add project overview, setup instructions, license, contribution guide, and security policy
- [x] Document current persistence boundaries and known limitations
- [ ] Version the Supabase schema, migrations, storage policies, and Row Level Security policies
- [ ] Generate database types from the versioned schema
- [ ] Review authenticated API caching in the service worker
- [ ] Validate and version backup files; restrict imports to an explicit table allowlist
- [ ] Add user ownership filters as defense in depth to all update and delete operations
- [ ] Add automated tests and continuous integration
- [ ] Replace legacy Supabase anon-key naming with a publishable client key while preserving deployments during migration

## Phase 2 — Visual foundation

- [ ] Define typography, color, spacing, elevation, and motion tokens
- [ ] Redesign application navigation for desktop and mobile
- [ ] Standardize empty, loading, error, and success states
- [ ] Simplify the dashboard into a focused daily command center
- [ ] Standardize all user-facing copy in Brazilian Portuguese
- [ ] Complete and verify PWA icons, install experience, and responsive behavior
- [ ] Add a safe demo or preview experience that does not expose production data

## Phase 3 — Connected planning workflow

- [ ] Connect goals to projects, projects to tasks, and tasks to calendar blocks
- [ ] Make the “Today” view the primary execution surface
- [ ] Add guided weekly planning and review
- [ ] Surface stalled goals, overdue commitments, and realistic workload
- [ ] Make habits, journal, metrics, and finances contextual inputs rather than isolated dashboards

## Phase 4 — Optional modules and collaboration

- [ ] Decide which secondary modules belong in the core product
- [ ] Make finance, shopping, books, and health modules optional where appropriate
- [ ] Implement real workspace membership and server-enforced permissions before enabling sharing
- [ ] Add import/export coverage for the complete, versioned data model

## Phase 5 — Privacy-conscious assistance

- [ ] Add opt-in natural-language capture
- [ ] Generate weekly summaries only after explicit user action
- [ ] Suggest next actions and identify stalled goals with transparent reasoning
- [ ] Explain exactly which data is sent to an AI provider and allow the feature to remain disabled

## Out of scope for now

- Adding new standalone modules without a connection to the core workflow
- Presenting prototype sharing as secure collaboration
- Claims about adoption, community size, or reliability that are not supported by evidence
