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

  // Match case-insensitively so this repairs (rather than duplicates) any admin
  // seeded before that normalization existed.
  const [existing] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`);

  if (existing) {
    await db
      .update(users)
      .set({ name, email, passwordHash, role: "admin" })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing admin user: ${email}`);
  } else {
    await db.insert(users).values({ name, email, passwordHash, role: "admin" });
    console.log(`Created admin user: ${email}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin user:", err);
  process.exit(1);
});
