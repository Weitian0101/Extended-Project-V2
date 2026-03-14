# Innovation Sandbox

Innovation Sandbox is a Next.js 16 app for running the Beyond Post-its workflow across Explore, Imagine, Implement, Test, and Tell Story.

This repo now supports two runtime modes:

- `local-mvp`: no backend credentials required, uses browser-local persistence
- `remote-supabase`: real auth, real database, real project and member persistence

The AI layer is still intentionally abstracted behind local service contracts so a client can replace it later with their own provider.

## What Is Real Now

When `remote-supabase` is configured, the app supports:

- real sign-in and sign-up with Supabase Auth
- Google and GitHub OAuth wiring in the auth UI
- password reset flow
- real user profiles
- real projects stored in Postgres
- real project members and permission changes
- reusable invite links for users who have not signed in yet
- real stage context and tool run persistence
- remote workspace export and import
- real API routes for workspace, profile, project, and project document data

## Free Stack

This project is designed to run on a zero-fixed-cost beta stack:

- frontend and API routes on Vercel Hobby
- auth and database on Supabase Free
- Google OAuth through Supabase Auth social providers

That keeps the demo and small-scale testing environment real without locking the client into your personal cloud setup.

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

If the Supabase variables are omitted, the app falls back to `local-mvp` mode.

## Supabase Setup

1. Create a free Supabase project.
2. Run the SQL migration in [supabase/migrations/20260314_000001_init_innovation_sandbox.sql](/D:/Local_Code/Extended_Project/supabase/migrations/20260314_000001_init_innovation_sandbox.sql).
3. Copy the project URL and publishable key into `.env.local`.
4. In Supabase Auth:
   - enable Email auth
   - enable Google provider
   - optionally enable GitHub provider
5. Set the redirect URL to:

```text
http://localhost:3000/auth/callback
```

For deployed environments, add:

```text
https://your-deployment-domain/auth/callback
```

For password reset emails, set the recovery redirect to:

```text
http://localhost:3000/auth/update-password
https://your-deployment-domain/auth/update-password
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deployment

Deploy to Vercel as a standard Next.js app.

Set the same public environment variables in the Vercel project:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Backup And Migration

- local mode exports `local-mvp-v1`
- remote mode exports `remote-supabase-v1`
- remote imports can recreate projects, documents, existing members, and pending invite links from either snapshot shape

## Handoff

For a clean client handoff, do not rely on transferring your own cloud resources.

Instead:

- give the client this repository
- give the client `.env.example`
- give the client the Supabase SQL migration
- have the client create their own Supabase, Vercel, and OAuth credentials
- redeploy under the client-owned accounts

The checklist for that rebuild is in [customer-rebuild-checklist.md](/D:/Local_Code/Extended_Project/docs/customer-rebuild-checklist.md).

The current runtime and endpoint contract is documented in [mvp-api-spec.md](/D:/Local_Code/Extended_Project/docs/mvp-api-spec.md).

## AI Replacement Point

All AI interactions are routed through:

- [aiGateway.ts](/D:/Local_Code/Extended_Project/src/lib/services/aiGateway.ts)
- [api.ts](/D:/Local_Code/Extended_Project/src/lib/contracts/api.ts)

That is the seam to replace when the client later connects a real model provider.
