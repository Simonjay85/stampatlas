import { readFile, writeFile } from "node:fs/promises";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { blogArticles, users } from "../drizzle/schema.ts";
import { addEditorialInternalLink, validateDraftQuality } from "../server/editorialDraftQuality.ts";

const MODEL = "gpt-5-mini";
const BATCH_SIZE = 5;
const MAX_CONCURRENCY = 2;
const allowedSources = {
  "Start, Scope and Organise a Collection": { label: "The Postal Museum: Beginners Guide to Stamp Collecting", url: "https://www.postalmuseum.org/blog/beginners-guide-to-stamp-collecting/" },
  "Identify, Describe and Research Stamps": { label: "Omaha Philatelic Society: Learn", url: "https://omahaphilatelicsociety.org/learn/" },
  "Care, Preservation and Condition Notes": { label: "Omaha Philatelic Society: Learn", url: "https://omahaphilatelicsociety.org/learn/" },
  "World Philately, Postal History and Thematic Collecting": { label: "The Postal Museum: Beginners Guide to Stamp Collecting", url: "https://www.postalmuseum.org/blog/beginners-guide-to-stamp-collecting/" },
  "Advanced Practice, Community and Digital Workflows": { label: "Wikimedia APIs", url: "https://www.mediawiki.org/wiki/Wikimedia_APIs" },
};

function parsePlan(markdown) {
  return markdown.split("\n").flatMap((line) => {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*`?(\/[^|`]+)`?\s*\|$/);
    if (!match) return [];
    const before = markdown.slice(0, markdown.indexOf(line));
    const cluster = [...before.matchAll(/^## Cluster [A-E] — (.+)$/gm)].at(-1)?.[1];
    if (!cluster) throw new Error(`No cluster found for editorial plan line ${match[1]}`);
    return [{ number: Number(match[1]), title: match[2], intent: match[3], relatedLink: match[4], cluster }];
  });
}
function toSlug(title) { return title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180); }
function chunks(items, size) { return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size)); }
function qualityGate(draft, planItem) {
  const body = addEditorialInternalLink(String(draft.bodyMarkdown ?? ""), planItem.relatedLink);
  const summary = String(draft.summary ?? "").trim();
  const seoTitle = String(draft.seoTitle ?? "").trim();
  const seoDescription = String(draft.seoDescription ?? "").trim();
  const errors = validateDraftQuality({ title: planItem.title, summary, bodyMarkdown: body, seoTitle, seoDescription, relatedLink: planItem.relatedLink });
  if (errors.length > 0) throw new Error(`Quality gate failed for ${planItem.number}: ${errors.join("; ")}`);
  return { slug: toSlug(planItem.title), title: planItem.title, summary, bodyMarkdown: body, cluster: planItem.cluster, seoTitle, seoDescription, canonicalUrl: null, sourceReferencesJson: JSON.stringify([allowedSources[planItem.cluster]]) };
}
async function generateBatch(batch) {
  const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_completion_tokens: 7000,
      messages: [
        { role: "system", content: "You are a careful global philately editor. Produce original English educational drafts only. Do not copy, paraphrase closely, quote, or claim facts not supplied. Never make price, rarity, authentication, investment, ownership, or legal conclusions. State uncertainty and recommend further research where appropriate." },
        { role: "user", content: `Write one 250–400 word Markdown draft for each editorial brief. Use a helpful H2 heading plus short paragraphs and one concise checklist. Use original explanatory wording, not source prose. Do not include citations or URLs; the CMS assigns reviewed source links separately. Keep all topics global rather than country-specific unless named in the title. Briefs:\n${JSON.stringify(batch)}` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "philately_draft_batch", strict: true, schema: { type: "object", properties: { articles: { type: "array", minItems: batch.length, maxItems: batch.length, items: { type: "object", properties: { number: { type: "integer" }, summary: { type: "string" }, bodyMarkdown: { type: "string" }, seoTitle: { type: "string" }, seoDescription: { type: "string" } }, required: ["number", "summary", "bodyMarkdown", "seoTitle", "seoDescription"], additionalProperties: false } } }, required: ["articles"], additionalProperties: false } } },
    }),
  });
  if (!response.ok) throw new Error(`LLM batch request failed (${response.status}): ${await response.text()}`);
  const payload = await response.json();
  const content = String(payload.choices?.[0]?.message?.content ?? "{}").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(content).articles ?? [];
}

const db = await getDb();
if (!db) throw new Error("DATABASE_URL is required to create editorial drafts");
if (!process.env.BUILT_IN_FORGE_API_URL || !process.env.BUILT_IN_FORGE_API_KEY) throw new Error("Built-in LLM credentials are unavailable");
const plan = parsePlan(await readFile(new URL("../docs/editorial-plan-global.md", import.meta.url), "utf8"));
if (plan.length !== 100) throw new Error(`Expected 100 editorial briefs; found ${plan.length}`);
const existing = await db.select({ slug: blogArticles.slug }).from(blogArticles).where(inArray(blogArticles.slug, plan.map((item) => toSlug(item.title))));
const existingSlugs = new Set(existing.map((item) => item.slug));
if (process.env.EDITORIAL_REFRESH_LINKS === "1") {
  const existingBodies = await db.select({ slug: blogArticles.slug, bodyMarkdown: blogArticles.bodyMarkdown }).from(blogArticles).where(inArray(blogArticles.slug, plan.map((item) => toSlug(item.title))));
  for (const article of existingBodies) {
    const item = plan.find((brief) => toSlug(brief.title) === article.slug);
    if (!item) continue;
    const enriched = addEditorialInternalLink(article.bodyMarkdown, item.relatedLink);
    if (enriched !== article.bodyMarkdown) await db.update(blogArticles).set({ bodyMarkdown: enriched }).where(eq(blogArticles.slug, article.slug));
  }
}
const requestedLimit = Number(process.env.EDITORIAL_LIMIT ?? "0");
const pending = plan.filter((item) => !existingSlugs.has(toSlug(item.title))).slice(0, Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : undefined);
const author = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).orderBy(desc(users.id)).limit(1);
if (!author[0]) throw new Error("An admin user must exist before creating editorial drafts");
const results = { requested: pending.length, created: 0, failed: [] };
const work = chunks(pending, BATCH_SIZE);
for (let index = 0; index < work.length; index += MAX_CONCURRENCY) {
  const group = work.slice(index, index + MAX_CONCURRENCY);
  const settled = await Promise.allSettled(group.map(async (batch) => {
    const generated = await generateBatch(batch);
    const byNumber = new Map(generated.map((draft) => [draft.number, draft]));
    const rows = batch.map((item) => qualityGate(byNumber.get(item.number) ?? {}, item));
    await db.insert(blogArticles).values(rows.map((row) => ({ ...row, authorUserId: author[0].id, status: "draft" })));
    return rows.length;
  }));
  settled.forEach((outcome, groupIndex) => { if (outcome.status === "fulfilled") results.created += outcome.value; else results.failed.push({ briefs: group[groupIndex].map((item) => item.number), error: String(outcome.reason) }); });
}
await writeFile(new URL("../docs/editorial-generation-report.json", import.meta.url), JSON.stringify({ ...results, model: MODEL, status: "draft_only", generatedAt: new Date().toISOString() }, null, 2));
console.log(JSON.stringify({ ...results, status: "draft_only", note: "No generated article was submitted for review or published." }, null, 2));
