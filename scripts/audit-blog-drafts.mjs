import { readFile, writeFile } from "node:fs/promises";
import { asc, inArray } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { blogArticles } from "../drizzle/schema.ts";
import { findSharedPhrases, validateDraftQuality } from "../server/editorialDraftQuality.ts";

function parsePlan(markdown) {
  return markdown.split("\n").flatMap((line) => {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*`?(\/[^|`]+)`?\s*\|$/);
    if (!match) return [];
    const before = markdown.slice(0, markdown.indexOf(line));
    const cluster = [...before.matchAll(/^## Cluster [A-E] — (.+)$/gm)].at(-1)?.[1];
    return cluster ? [{ title: match[2], relatedLink: match[4] }] : [];
  });
}
function toSlug(title) { return title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180); }

const db = await getDb();
if (!db) throw new Error("DATABASE_URL is required for editorial audit");
const plan = parsePlan(await readFile(new URL("../docs/editorial-plan-global.md", import.meta.url), "utf8"));
const expectedSlugs = plan.map((item) => toSlug(item.title));
const articles = await db.select().from(blogArticles).where(inArray(blogArticles.slug, expectedSlugs)).orderBy(asc(blogArticles.slug));
const briefs = new Map(plan.map((item) => [toSlug(item.title), item]));
const errors = articles.flatMap((article) => {
  const brief = briefs.get(article.slug);
  if (!brief) return [{ slug: article.slug, errors: ["Unexpected slug"] }];
  const issues = validateDraftQuality({ title: article.title, summary: article.summary, bodyMarkdown: article.bodyMarkdown, seoTitle: article.seoTitle, seoDescription: article.seoDescription, relatedLink: brief.relatedLink });
  return issues.length > 0 ? [{ slug: article.slug, errors: issues }] : [];
});
const report = {
  auditedAt: new Date().toISOString(),
  expectedDrafts: 100,
  foundDrafts: articles.length,
  draftCount: articles.filter((article) => article.status === "draft").length,
  nonDraftSlugs: articles.filter((article) => article.status !== "draft").map((article) => article.slug),
  missingSlugs: expectedSlugs.filter((slug) => !articles.some((article) => article.slug === slug)),
  qualityErrors: errors,
  sharedPhrases: findSharedPhrases(articles.map(({ slug, bodyMarkdown }) => ({ slug, bodyMarkdown }))),
};
await writeFile(new URL("../docs/editorial-generation-report.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ foundDrafts: report.foundDrafts, draftCount: report.draftCount, missing: report.missingSlugs.length, qualityErrors: report.qualityErrors.length, sharedPhrases: report.sharedPhrases.length }, null, 2));
if (report.foundDrafts !== 100 || report.draftCount !== 100 || report.missingSlugs.length || report.qualityErrors.length || report.sharedPhrases.length) process.exitCode = 1;
