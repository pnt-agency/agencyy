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

This setup (Docker Compose for Postgres only, app run with `npm run dev` /
`npm run start` directly) is intended for local development. For production,
point `DATABASE_URL` at a managed Postgres instance (e.g. RDS, Neon, Supabase,
or a Postgres container on your production host) and run migrations with
`npm run db:migrate` against it before starting the app with `npm run build && npm run start`.
