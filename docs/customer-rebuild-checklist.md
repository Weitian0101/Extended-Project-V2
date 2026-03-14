# Customer Rebuild Checklist

Use this when the client is ready to recreate the platform under their own accounts instead of taking over your temporary beta environment.

## Accounts To Create

- GitHub repository owned by the client
- Vercel project owned by the client
- Supabase project owned by the client
- Google Cloud OAuth credentials owned by the client
- optionally GitHub OAuth credentials owned by the client

## Code Transfer

- push the final code to the client-owned GitHub repository
- keep `.env.example` in the repo
- do not commit real credentials

## Supabase

1. Create a new project in the client account.
2. Run [20260314_000001_init_innovation_sandbox.sql](/D:/Local_Code/Extended_Project/supabase/migrations/20260314_000001_init_innovation_sandbox.sql).
3. Enable Email auth.
4. Enable Google auth and set callback URLs.
5. Optionally enable GitHub auth.
6. Copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
7. Set password recovery URLs for:
   - `http://localhost:3000/auth/update-password`
   - the deployed `/auth/update-password` path

## Vercel

1. Import the client-owned GitHub repo.
2. Add environment variables:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Deploy.
4. Add the deployed domain to Supabase auth redirect URLs.

## Google OAuth

1. Create or use a client-owned Google Cloud project.
2. Configure the OAuth consent screen.
3. Add authorized redirect URIs for:
   - local development
   - the Vercel deployment domain
4. Enter the Google client credentials in Supabase Auth provider settings.

## Validation Pass

After rebuild, verify:

- a new user can register with email and password
- Google sign-in redirects back successfully
- password reset emails land on the reset page and update the password successfully
- a signed-in user sees an empty or seeded dashboard
- a user can create a project
- a project can be opened and edited
- tool runs persist across refresh
- an existing signed-in user can be added to a project by email
- a new email address receives an invite link and can accept it after sign-in
- permissions can be updated in project settings
- remote workspace export and import both succeed

## What Not To Transfer

If this beta was built under your own accounts, do not rely on transferring:

- your Vercel project
- your Supabase project
- your Google OAuth app

Recreating them under the client account is cleaner and avoids long-term ownership ambiguity.
