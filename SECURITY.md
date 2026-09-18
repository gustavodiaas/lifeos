# Security Policy

LifeOS handles personal planning, journal, health, and financial information. Security and privacy reports are treated as a priority.

## Supported version

LifeOS is currently pre-release. Only the latest commit on `main` is considered for security fixes.

## Reporting a vulnerability

Please do not open a public issue for vulnerabilities or suspected exposure of personal data.

Use [GitHub private vulnerability reporting](https://github.com/gustavodiaas/lifeos/security/advisories/new) and include:

- the affected feature or file;
- clear reproduction steps;
- the potential impact;
- any suggested mitigation;
- whether the report involves real user data.

Do not access, modify, download, or retain data that does not belong to you. Use test accounts and the minimum proof necessary.

## Secrets and configuration

- Never commit Supabase database passwords, secret keys, `service_role` keys, access tokens, or production exports.
- Values placed in `VITE_` variables are included in the browser bundle and must not be treated as secrets.
- If a secret is committed, remove it from use immediately and rotate it. Removing the file from Git is not sufficient.

## Current security scope

The repository does not yet contain the Supabase schema, migrations, or Row Level Security policies used by the deployed application. Until those artifacts are versioned and reviewed, contributors should not assume that the repository alone represents the complete production security model.
