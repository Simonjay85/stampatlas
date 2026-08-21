import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { blogArticles, users } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const createdUserIds: number[] = [];
const createdSlugs: string[] = [];

async function createUser(role: "reviewer" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database is required for blog integration tests");
  const result = await db.insert(users).values({ openId: `blog-${role}-${crypto.randomUUID()}`, name: "Blog Test Editor", role });
  const id = Number(result[0].insertId); createdUserIds.push(id); return id;
}
function contextFor(id: number, role: "reviewer" | "admin"): TrpcContext {
  return { user: { id, openId: `blog-${id}`, name: "Blog Test Editor", email: null, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}
beforeEach(() => { createdUserIds.length = 0; createdSlugs.length = 0; });
afterEach(async () => {
  const db = await getDb(); if (!db) return;
  for (const slug of createdSlugs) await db.delete(blogArticles).where(eq(blogArticles.slug, slug));
  for (const id of createdUserIds) await db.delete(users).where(eq(users.id, id));
});

describe("blog editorial workflow", () => {
  it("keeps drafts private until a reviewer submits and an admin publishes a sourced article", async () => {
    const reviewerId = await createUser("reviewer"); const adminId = await createUser("admin");
    const reviewer = appRouter.createCaller(contextFor(reviewerId, "reviewer")); const admin = appRouter.createCaller(contextFor(adminId, "admin"));
    const slug = `original-stamp-notes-${crypto.randomUUID().slice(0, 10)}`; createdSlugs.push(slug);
    const article = await reviewer.blog.create({ slug, title: "How to Record Original Stamp Research Notes", summary: "A practical, original workflow for recording visible details, sources and uncertainty without treating a catalogue entry as proof.", bodyMarkdown: "# Record observations first\n\nThis original draft explains how to separate visible details from research questions.", cluster: "Advanced practice", seoTitle: "How to Record Original Stamp Research Notes", seoDescription: "Learn an original, source-aware process for writing durable stamp research notes without overclaiming identification or value.", sourceReferences: [{ label: "Wikimedia API documentation", url: "https://www.mediawiki.org/wiki/Wikimedia_APIs" }] });
    expect(await reviewer.blog.bySlug({ slug })).toBeNull();
    await reviewer.blog.submitForReview({ id: article.id });
    await admin.blog.publish({ id: article.id });
    expect(await reviewer.blog.bySlug({ slug })).toMatchObject({ slug, status: "published", sourceReferences: [expect.objectContaining({ label: "Wikimedia API documentation" })] });
  }, 20_000);
});
