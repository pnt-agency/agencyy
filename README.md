# Agency Build

## Stack

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL 16, run locally via Docker Compose
- **ORM:** Drizzle ORM (+ Drizzle Kit for migrations)
- **Auth:** NextAuth — credentials (email/password, hashed with bcrypt) + Google OAuth
- **Email:** Resend

The app itself runs directly with `npm run dev` on your machine. Only the
database runs in Docker for now.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console (optional, only needed for Google sign-in)
- `RESEND_API_KEY` — from your Resend dashboard

The `POSTGRES_*` and `DATABASE_URL` values already work together out of the
box for local development — change them only if you need different
credentials or the default port (5432) is taken on your machine.

## 3. Start the database

```bash
docker compose up -d
```

This starts a Postgres 16 container named `agency-build-db`, with data
persisted in a named Docker volume (`agency_build_pgdata`) so it survives
container restarts.

Check it's healthy:

```bash
docker compose ps
```

You should see `agency-build-db` with status `healthy`. If it's still
`starting`, give it a few seconds.

To view logs:

```bash
docker compose logs -f db
```

To stop the database (data is preserved):

```bash
docker compose down
```

To stop the database **and delete all data**:

```bash
docker compose down -v
```

## 4. Run database migrations

With the container running and `.env.local` configured:

```bash
npm run db:migrate
```

This creates the `talents`, `employers`, and `users` tables.

If you change `lib/db/schema.ts` later, generate a new migration before
running it:

```bash
npm run db:generate
npm run db:migrate
```

You can also browse the database visually:

```bash
npm run db:studio
```

## 5. Create an admin user

Admin login now lives in Postgres instead of the old `ADMIN_EMAIL` /
`ADMIN_PASSWORD` environment variables. Create your first admin with:

```bash
npm run seed:admin -- admin@agencybuild.com "Admin Name" "a-strong-password"
```

Re-running this command with the same email updates that user's name and
password instead of creating a duplicate.

If you want to allow a Google account to sign in as well, add a row for that
email to the `users` table (via `npm run db:studio`, or re-run the seed
script with that email) — `passwordHash` can be left unset since Google
sign-in doesn't use it. Google sign-in is only permitted for emails that
already exist in the `users` table.

## 6. Run the app

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000), connecting
to the Postgres container started in step 3.

## Project structure (backend-relevant)

```
docker-compose.yml      # Postgres 16 container definition
drizzle.config.ts       # Drizzle Kit config (migration generation/target)
drizzle/                # Generated SQL migration files — commit these
lib/
  db/
    index.ts            # Drizzle client / connection pool
    schema.ts           # Table definitions (talents, employers, users)
  queries.ts            # CRUD functions used by Server Actions
  auth.ts               # NextAuth config (credentials + Google)
  resend.ts             # Email sending
scripts/
  seed-admin.ts         # CLI to create/update admin users
app/
  actions.ts            # Server Actions for the public application forms
```

## Notes on the Postgres migration

This project originally used Airtable as a dummy backend. It now uses
Postgres with Drizzle ORM:

- `Talent` and `Employer` records now have **UUID** primary keys instead of
  Airtable record IDs (the `id` field in `types/index.ts` is still typed as
  `string`, so no application code needed to change).
- `status` fields are enforced as Postgres enums, matching the existing
  TypeScript union types.
- Admin authentication moved from a single hardcoded email/password pair in
  environment variables to a real `users` table with bcrypt-hashed
  passwords — see step 5 above.

## Production deployment

The Docker Compose setup above is for local development only. In production the
app runs on **Vercel** and the database on **Neon**.

Both `drizzle-kit` and the seed script read `.env.local`, but a shell variable
takes precedence — so you can run either against Neon without editing that file.
Every command below assumes `$NEON_URL` is set to your Neon connection string:

```bash
export NEON_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
```

### 1. Create the Neon database

Create a project at [neon.tech](https://neon.tech) and copy the **pooled**
connection string (the host contains `-pooler`). Serverless functions open a
connection per cold start, so the pooler — not the direct endpoint — is what
keeps Neon's connection limit from being exhausted. Keep `?sslmode=require`.

### 2. Migrate and seed Neon

Run these from your machine before the first deploy — Vercel does not run
migrations for you:

```bash
DATABASE_URL="$NEON_URL" npx drizzle-kit migrate
DATABASE_URL="$NEON_URL" npm run seed:admin -- someone@example.com "Their Name" "a-strong-password"
```

### 3. Configure Vercel environment variables

Set these **before** the first deploy. `lib/db/index.ts` throws at import when
`DATABASE_URL` is missing, and the build imports it while prerendering — so a
deploy without these fails at build time, not at runtime.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The pooled Neon string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` — a fresh one, not your local value |
| `NEXTAUTH_URL` | The full production URL, e.g. `https://your-app.vercel.app` |
| `RESEND_API_KEY` | From the Resend dashboard |
| `ADMIN_NOTIFICATION_EMAIL` | Where new application/inquiry alerts go |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — omit both to hide the Google button |

`NEXTAUTH_URL` matters more than it looks: `appBaseUrl()` in `lib/tokens.ts`
falls back to `http://localhost:3000`, so if it's unset every verification and
password-reset email ships a link to localhost. Vercel assigns the domain on
first deploy, so either set it to the expected `<project>.vercel.app` up front,
or set it afterwards and redeploy.

The `POSTGRES_*` variables are only read by `docker-compose.yml`. Vercel doesn't
need them.

### 4. Deploy

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
The defaults (Next.js preset, `npm run build`) are correct — no overrides.

### 5. If using Google sign-in

Add the production callback URL to the Google Cloud Console OAuth client's
**Authorized redirect URIs**:

```
https://your-app.vercel.app/api/auth/callback/google
```

Sign-in fails with `redirect_uri_mismatch` until this exactly matches the
deployed domain.

### Subsequent schema changes

Migrations are not automatic. After merging a change that adds a migration:

```bash
DATABASE_URL="$NEON_URL" npx drizzle-kit migrate
```

Run it before (or immediately after) the deploy that depends on it.
