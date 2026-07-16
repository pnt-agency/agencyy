/**
 * Creates (or updates) an admin user in Postgres.
 *
 * Usage:
 *   npm run seed:admin -- admin@agencybuild.com "Admin Name" "supersecretpassword"
 *
 * Run this once after `docker compose up -d` + migrations, to replace the old
 * ADMIN_EMAIL / ADMIN_PASSWORD env-based login.
 */
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function main() {
  const [rawEmail, name, password] = process.argv.slice(2);

  if (!rawEmail || !name || !password) {
    console.error(
      'Usage: npm run seed:admin -- admin@agencybuild.com "Admin Name" "password"'
    );
    process.exit(1);
  }

  // Store the email lowercased, exactly like createUser() does. Every sign-in
  // path in lib/auth.ts looks the address up lowercased, so a mixed-case row
  // here is a row nobody can ever log into — and Google sign-in would silently
  // create a second, non-admin account alongside it.
  const email = rawEmail.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  // Mark the address verified. Seeding requires database credentials, so the
  // operator running this is already vouching for the account — and a seeded
  // admin has no other route to verified, since receiving the confirmation
  // email depends on Resend having a verified sending domain. Without this they
  // sit behind a "check your inbox" banner for a mail that never arrives.
  const emailVerified = new Date();

  // Match case-insensitively so this repairs (rather than duplicates) any admin
  // seeded before that normalization existed.
  const [existing] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`);

  if (existing) {
    await db
      .update(users)
      .set({
        name,
        email,
        passwordHash,
        role: "admin",
        // Keep the original verification timestamp if there is one — re-seeding
        // to change a password shouldn't look like a fresh verification.
        emailVerified: existing.emailVerified ?? emailVerified,
      })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing admin user: ${email}`);
  } else {
    await db.insert(users).values({ name, email, passwordHash, role: "admin", emailVerified });
    console.log(`Created admin user: ${email}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin user:", err);
  process.exit(1);
});
