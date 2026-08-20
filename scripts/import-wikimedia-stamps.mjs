import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).flatMap((value, index, values) => value.startsWith("--") ? [[value.slice(2), values[index + 1]?.startsWith("--") ? true : values[index + 1]]] : []));
const query = typeof args.query === "string" ? args.query : "postage stamp";
const limit = Math.min(Math.max(Number(args.limit || 10), 1), 50);
const destination = typeof args.out === "string" ? resolve(args.out) : null;

const clean = (value = "") => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const metadata = (entry, key) => clean(entry?.[key]?.value || "");
const reuseStatus = (licence) => /public domain|\bpd\b/i.test(licence) ? "public_domain" : /cc\s*by/i.test(licence) ? "cc_by" : "needs_review";

const params = new URLSearchParams({
  action: "query",
  format: "json",
  formatversion: "2",
  generator: "search",
  gsrsearch: `${query} filetype:bitmap`,
  gsrnamespace: "6",
  gsrlimit: String(limit),
  prop: "imageinfo|info",
  inprop: "url",
  iiprop: "url|extmetadata|mime",
  iiurlwidth: "1000",
  origin: "*",
});

const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { "User-Agent": "StampAtlas-import-example/1.0 (rights-review workflow)" } });
if (!response.ok) throw new Error(`Wikimedia API returned ${response.status}`);
const payload = await response.json();
const records = (payload.query?.pages || []).map((page) => {
  const image = page.imageinfo?.[0] || {};
  const rights = metadata(image.extmetadata, "LicenseShortName") || metadata(image.extmetadata, "UsageTerms");
  const attribution = metadata(image.extmetadata, "Artist") || metadata(image.extmetadata, "Credit");
  return {
    provider: "wikimedia_commons",
    sourceRecordId: String(page.pageid),
    canonicalUrl: page.fullurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    title: page.title.replace(/^File:/, ""),
    description: metadata(image.extmetadata, "ImageDescription"),
    reuseStatus: reuseStatus(rights),
    rightsLabel: rights || null,
    rightsUrl: metadata(image.extmetadata, "LicenseUrl") || null,
    attribution: attribution || null,
    sourcePayload: JSON.stringify(page),
    assets: image.url ? [{ providerAssetId: String(page.pageid), mediaUrl: image.url, previewUrl: image.thumburl || image.url, mimeType: image.mime || null, creator: metadata(image.extmetadata, "Artist") || null, attribution: attribution || null, rightsLabel: rights || null, rightsUrl: metadata(image.extmetadata, "LicenseUrl") || null, reuseStatus: reuseStatus(rights) }] : [],
  };
});
const result = { provider: "wikimedia_commons", query, records };
if (destination) { await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, `${JSON.stringify(result, null, 2)}\n`); }
else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
