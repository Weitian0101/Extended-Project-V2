# Innovation Sandbox for ADT

[Chinese documentation / 中文说明](./README.zh-CN.md)

## Project Context

<p align="left">
  <img src="./public/images/UCLSoM_Logo.jpg" alt="UCL School of Management" height="90" />
  <img src="./public/images/logo.png" alt="Innovation Sandbox for ADT logo" height="90" />
</p>

This repository documents a Sandbox platform designed and built for Academy of Design Thinking. It was produced as part of the requirements for the Information Management for Business programme at University College London.

Unless otherwise indicated, the implementation and documentation are substantially the result of my own work. The project may be freely copied and distributed provided the source is explicitly acknowledged.

## Platform Overview

Innovation Sandbox is a Next.js 16 workspace for running the Beyond Post-its process across project setup, exploration, ideation, implementation, and storytelling.

The repository can run in two modes:

- `local-mvp`: browser-only persistence, no cloud setup required
- `remote-supabase`: Supabase-backed auth, projects, members, invites, and persistent workspace data

This is a single Next.js application. The frontend, API routes, auth callbacks, and deployment target all live in the same codebase, so there is no separate backend service to deploy.

## What You Get

- marketing homepage and branded loading/auth flows
- dashboard with project cards, review queues, assignments, and recent activity
- project workspace with hub, context, stage navigation, and AI facilitator entry points
- local mode for quick demos
- remote mode for real user accounts and real project persistence
- workspace export/import
- invite links and optional invite emails

## Tech Stack

- Next.js 16
- React 19
- Supabase Auth + Postgres for remote mode
- Vercel for web hosting and serverless API routes
- optional OpenAI-compatible AI provider for facilitator flows
- optional Resend for invite emails

## Deployment Modes

| Mode | When to use it | What is required |
| --- | --- | --- |
| `local-mvp` | quick demo, design review, offline prototype | `npm install` and `npm run dev` |
| `remote-supabase` | real deployment with accounts and persistent data | Supabase project, environment variables, and a Vercel deployment or local dev server |

Remote mode is enabled automatically when both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are present.

## Prerequisites

For a full cloud deployment, prepare these first:

- Node.js 20+
- npm
- a GitHub repository
- a Vercel account
- a Supabase project
- optionally a Resend account if invite emails should be sent from the app

## 1. Clone And Install

```bash
git clone https://github.com/your-org/your-repo.git
cd your-repo
npm install
```

## 2. Create Your Environment File

Copy the example file:

```bash
cp .env.example .env.local
```

Current variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | yes | Base URL for local auth redirects, password reset, invite links, and production callback URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | yes for remote mode | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes for remote mode | Supabase publishable key |
| `AI_API_KEY` | optional | Enables real server-side AI responses for prompt board, facilitator chat, and step assist |
| `AI_MODEL` | optional | Model name sent to the OpenAI-compatible chat completions endpoint |
| `AI_BASE_URL` | optional | Base URL for an OpenAI-compatible API, defaults to `https://api.openai.com/v1` |
| `AI_TEMPERATURE` | optional | Default sampling temperature for AI requests |
| `AI_TIMEOUT_MS` | optional | Timeout for AI requests in milliseconds |
| `DEMO_ADMIN_EMAIL` | optional | Enables the "Open Test Workspace" button on the sign-in screen |
| `DEMO_ADMIN_PASSWORD` | optional | Password for the demo admin account |
| `DEMO_ADMIN_NAME` | optional | Display name for the demo admin account |
| `RESEND_API_KEY` | optional | Enables sending project invite emails |
| `INVITE_FROM_EMAIL` | optional | Sender address used for invite emails |

Notes:

- If you leave the Supabase variables empty, the app falls back to `local-mvp`.
- For local development, `NEXT_PUBLIC_APP_URL` should be `http://localhost:3000`.
- For production on Vercel, `NEXT_PUBLIC_APP_URL` should be your real HTTPS domain.
- If you leave `AI_API_KEY` empty, the AI UI still works but responses come from the built-in local mock gateway.

## 3. Set Up Supabase

Create a new Supabase project, then apply every SQL migration in `supabase/migrations/` in this order:

1. `20260314_000001_init_innovation_sandbox.sql`
2. `20260314_000002_profile_membership.sql`
3. `20260314_000002_project_collaboration.sql`
4. `20260314_000003_fix_rls_recursion.sql`
5. `20260314_000004_auth_experience_hardening.sql`
6. `20260314_000005_fix_owner_project_bootstrap.sql`
7. `20260314_000006_fix_projects_select_owner_policy.sql`
8. `20260315_000007_profile_guide_preferences.sql`
9. `20260315_000008_project_brief_metadata.sql`

The safest way is to open Supabase SQL Editor and run the files one by one in the order above.

After that, copy these values from Supabase into `.env.local` and later into Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

This project does not require a Supabase service-role key for normal deployment.

## 4. Configure Supabase Auth

In Supabase Auth settings:

- enable Email auth
- set the Site URL to your primary app URL
- add redirect URLs for both local and deployed environments

Recommended redirect URLs:

```text
http://localhost:3000
http://localhost:3000/auth/callback
http://localhost:3000/auth/update-password
https://your-domain.example
https://your-domain.example/auth/callback
https://your-domain.example/auth/update-password
```

Why all three are needed:

- the app uses the root URL for some confirmation and password-reset flows
- `/auth/callback` is used for OAuth-style callback handling and invite flows
- `/auth/update-password` is used by the password reset screen

If you plan to use social auth in Supabase later, these redirect URLs already cover the callback routes this app expects.

## 5. Run Locally

For local-only demo mode:

```bash
npm run dev
```

For full remote mode:

1. fill in the Supabase values in `.env.local`
2. run the same command:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

- `npm run lint`
- `npm run build`

## 6. Deploy To Vercel

1. Push the repository to GitHub.
2. Import the repository into Vercel as a standard Next.js project.
3. Add the same environment variables in Vercel Project Settings.
4. Deploy.
5. After the first deploy, confirm that your production domain is also listed in Supabase Auth redirect URLs and Site URL.

Recommended Vercel environment setup:

- Development: local values if you use Vercel development environments
- Preview: preview domain values only if you need auth flows to work on previews
- Production: your real production domain in `NEXT_PUBLIC_APP_URL`

If you only care about production auth flows, setting the variables for Production is enough.

## 7. Optional Features

### Invite Emails

Project invite links work without email delivery. Team members can copy and share invite links manually.

If you want the "Send Email" action to work from Project Settings, also set:

```env
RESEND_API_KEY=your_resend_api_key
INVITE_FROM_EMAIL=Innovation Sandbox <onboarding@your-domain.example>
```

Without `RESEND_API_KEY`, the app still runs, but the invite email endpoint will return an error when used.

### AI Provider

The app now exposes real server-side AI routes:

- `POST /api/ai/prompt-board`
- `POST /api/ai/facilitator-chat`
- `POST /api/ai/step-assist`

What the backend actually uses:

- the project-level `aiHandoffPrompt` as the primary system prompt when it exists
- the generated project context markdown from challenge, audiences, and constraints
- method metadata like stage, method title, selected prompt, step type, and recent facilitator history

What it does not do yet:

- store standalone `.md` files on disk
- stream responses token-by-token
- persist raw prompt/response logs separately from existing tool run data

To enable real AI responses, set:

```env
AI_API_KEY=your_api_key
AI_MODEL=gpt-4.1-mini
AI_BASE_URL=https://api.openai.com/v1
```

If you use another OpenAI-compatible provider, point `AI_BASE_URL` at that provider instead.

### Demo Admin Access

If you want a one-click demo workspace button on the sign-in page, set:

```env
DEMO_ADMIN_EMAIL=admin@example.com
DEMO_ADMIN_PASSWORD=change_this_password
DEMO_ADMIN_NAME=Sandbox Admin
```

When configured, the sign-in page shows an `Open Test Workspace` button. The backend will try to sign in with that account and will create it if it does not exist yet.

## 8. Production Validation Checklist

Before calling the deployment done, verify:

- the homepage loads correctly
- sign-in works
- registration works
- password reset returns to the app correctly
- a user can create a project
- opening a project from the dashboard creates a new tab and keeps the original dashboard tab unchanged
- refreshing inside a project keeps the user in the same project
- project edits persist after refresh
- project invite links can be created
- invite emails send successfully if Resend is configured
- workspace export/import works
- `npm run build` passes locally or in CI

## 9. Troubleshooting

### The app always behaves like a local demo

`remote-supabase` only turns on when both of these are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Auth redirects back to the wrong page or fails

Usually one of these is wrong:

- `NEXT_PUBLIC_APP_URL`
- Supabase Site URL
- Supabase redirect URLs

Make sure local and production URLs are both configured exactly, including `/auth/callback` and `/auth/update-password`.

### Invite emails fail

Set `RESEND_API_KEY`. The manual invite-link flow still works even without email delivery.

### The demo admin button does not appear

Set both `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`.

## Additional Documentation

- [API and runtime notes](docs/mvp-api-spec.md)
- [Rebuild checklist](docs/customer-rebuild-checklist.md)

## AI Integration Boundary

The AI layer is now isolated behind server routes so it can be replaced later without rewriting the product surface.

Primary handoff points:

- `src/lib/services/aiGateway.ts`
- `src/lib/server/aiGateway.ts`
- `src/lib/contracts/api.ts`

Current behavior:

- with `AI_API_KEY`: real server-side AI calls through an OpenAI-compatible API
- without `AI_API_KEY`: automatic fallback to the existing local mock responses
