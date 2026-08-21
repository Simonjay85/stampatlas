import { desc, eq } from "drizzle-orm";
import { getDb, stageExternalStampRecords } from "../server/db.ts";
import { fetchWikimediaStampRecords } from "../server/importers/wikimedia.ts";
import { users } from "../drizzle/schema.ts";

const db = await getDb();
if (!db) throw new Error("DATABASE_URL is required to stage Wikimedia records");
const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).orderBy(desc(users.id)).limit(1);
if (!admins[0]) throw new Error("An admin user must exist before staging external records");

const queries = ["postage stamp", "Japan postage stamp", "India postage stamp", "France postage stamp", "Brazil postage stamp"];
const results = [];
for (const query of queries) {
  const records = await fetchWikimediaStampRecords(query, 20);
  if (records.length) results.push(await stageExternalStampRecords(admins[0].id, "wikimedia_commons", query, records));
}
console.log(JSON.stringify({ provider: "wikimedia_commons", jobs: results, published: 0, note: "All records were staged for review; none were published." }, null, 2));
process.exit(0);
