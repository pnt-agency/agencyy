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
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function main() {
  const [email, name, password] = process.argv.slice(2);

  if (!email || !name || !password) {
    console.error(
      'Usage: npm run seed:admin -- admin@agencybuild.com "Admin Name" "password"'
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing) {
    await db
      .update(users)
      .set({ name, passwordHash, role: "admin" })
      .where(eq(users.email, email));
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
