/**
 * Finds — and optionally deletes — employer inquiries left behind by the
 * automated submissions that hit the public /hire form.
 *
 * Usage:
 *   npm run purge:spam            # dry run: lists what would go, changes nothing
 *   npm run purge:spam -- --apply # actually delete
 *
 * ## How a row is identified
 *
 * By the rule that now rejects these at submit time: a start date that isn't a
 * plausible calendar date (see isPlausibleStartDate in lib/validation.ts). Every
 * observed spam row carried "1970-05-31" — random digits typed into a date
 * input, which the old schema accepted because it only checked the string was
 * non-empty.
 *
 * Matching on the validation rule rather than on that literal date is
 * deliberate: it catches the same class of junk if the generator's output
 * shifted, and it stays honest about *why* a row is considered spam.
 *
 * ## What it will not touch
 *
 * Rows attributed to a real member account (user_id is not null) are always
 * skipped, however they look. A real person's inquiry with an odd date is a
 * data-quality problem to fix by hand, not something a bulk script should
 * delete. Those are listed separately so they can be reviewed.
 */
import { and, inArray, isNull } from "drizzle-orm";
import { db } from "../lib/db";
import { employers } from "../lib/db/schema";
import { isPlausibleStartDate } from "../lib/validation";

async function main() {
  const apply = process.argv.includes("--apply");

  const rows = await db.select().from(employers);
  const suspicious = rows.filter((row) => !isPlausibleStartDate(row.startDate ?? ""));
  const [attributed, orphaned] = [
    suspicious.filter((row) => row.userId !== null),
    suspicious.filter((row) => row.userId === null),
  ];

  console.log(`Scanned ${rows.length} employer inquiries.`);
  console.log(`Matched ${suspicious.length} with an implausible start date.\n`);

  if (attributed.length > 0) {
    console.log(
      `Skipping ${attributed.length} row(s) linked to a real account — review these by hand:`
    );
    for (const row of attributed) {
      console.log(`  - ${row.id}  ${row.companyName}  <${row.email}>  start=${row.startDate}`);
    }
    console.log("");
  }

  if (orphaned.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  console.log(`${apply ? "Deleting" : "Would delete"} ${orphaned.length} row(s):`);
  // A sample rather than the whole list — this is expected to run into the
  // hundreds, and a screen of scrollback isn't a safety check.
  for (const row of orphaned.slice(0, 20)) {
    console.log(`  - ${row.id}  ${row.companyName}  <${row.email}>  start=${row.startDate}`);
  }
  if (orphaned.length > 20) console.log(`  ... and ${orphaned.length - 20} more`);

  if (!apply) {
    console.log("\nDry run — nothing was changed. Re-run with --apply to delete.");
    return;
  }

  // Deleted by explicit id, ANDed with the same user_id guard used to build the
  // list. Both halves matter: the id list is what was actually reviewed above,
  // and the isNull re-check means an attributed row can't be removed even if
  // that list were somehow built wrong. A WHERE broad enough to stand on its
  // own — say, every unattributed row — would take every legitimate anonymous
  // inquiry with it.
  const ids = orphaned.map((row) => row.id);
  const deleted = await db
    .delete(employers)
    .where(and(inArray(employers.id, ids), isNull(employers.userId)))
    .returning({ id: employers.id });

  console.log(`\nDeleted ${deleted.length} row(s).`);
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
