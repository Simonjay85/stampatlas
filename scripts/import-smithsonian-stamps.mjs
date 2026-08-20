import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).flatMap((value, index, values) => value.startsWith("--") ? [[value.slice(2), values[index + 1]?.startsWith("--") ? true : values[index + 1]]] : []));
const apiKey = process.env.SMITHSONIAN_API_KEY;
if (!apiKey) throw new Error("Set SMITHSONIAN_API_KEY before running this adapter. Obtain a key from Smithsonian Open Access developer tools.");
const query = typeof args.query === "string" ? args.query : "postage stamp";
const rows = Math.min(Math.max(Number(args.limit || 10), 1), 100);
const destination = typeof args.out === "string" ? resolve(args.out) : null;

const response = await fetch(`https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(query)}&rows=${rows}&api_key=${encodeURIComponent(apiKey)}`, { headers: { "User-Agent": "StampAtlas-import-example/1.0 (rights-review workflow)" } });
if (!response.ok) throw new Error(`Smithsonian API returned ${response.status}`);
const payload = await response.json();
const records = (payload.response?.rows || []).map((row) => {
  const descriptive = row.content?.descriptiveNonRepeating || {};
  const media = descriptive.online_media?.media?.find((asset) => asset.type === "Images") || descriptive.online_media?.media?.[0];
  const rights = descriptive.usage?.[0] || "Needs asset-level rights review";
  const imageUrl = media?.resources?.[0]?.url || null;
  return {
    provider: "smithsonian",
    sourceRecordId: String(row.id),
    canonicalUrl: descriptive.record_link || `https://www.si.edu/object/${row.id}`,
    title: row.title || "Untitled Smithsonian record",
    description: row.content?.freetext?.notes?.[0]?.content || null,
    reuseStatus: /cc0|public domain/i.test(rights) ? "public_domain" : "needs_review",
    rightsLabel: rights,
    rightsUrl: "https://www.si.edu/openaccess",
    attribution: descriptive.title?.content || "Smithsonian Institution",
    sourcePayload: JSON.stringify(row),
    assets: imageUrl ? [{ providerAssetId: `${row.id}:primary`, mediaUrl: imageUrl, previewUrl: imageUrl, mimeType: null, creator: null, attribution: "Smithsonian Institution", rightsLabel: rights, rightsUrl: "https://www.si.edu/openaccess", reuseStatus: /cc0|public domain/i.test(rights) ? "public_domain" : "needs_review" }] : [],
  };
});
const result = { provider: "smithsonian", query, records };
if (destination) { await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, `${JSON.stringify(result, null, 2)}\n`); }
else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
