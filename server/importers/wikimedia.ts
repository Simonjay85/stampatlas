import type { ImportedStampInput, ReuseStatus } from "../db";

type CommonsPage = { pageid: number; title: string; fullurl?: string; imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }> };
type CommonsResponse = { query?: { pages?: Record<string, CommonsPage> } };

function plain(value?: string) { return (value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(); }
export function classifyCommonsReuseStatus(license: string): ReuseStatus {
  const normalized = license.toLowerCase();
  if (/public domain|cc0/.test(normalized)) return "public_domain";
  if (/cc[- ]?by/.test(normalized) && !/\b(?:sa|nd)\b/.test(normalized)) return "cc_by";
  return "needs_review";
}
export function mapCommonsPage(page: CommonsPage): ImportedStampInput | null {
  const image = page.imageinfo?.[0];
  if (!image?.url || !image.mime?.startsWith("image/")) return null;
  const metadata = image.extmetadata ?? {};
  const license = plain(metadata.LicenseShortName?.value) || plain(metadata.UsageTerms?.value);
  const attribution = plain(metadata.Artist?.value) || plain(metadata.Credit?.value) || null;
  const reuseStatus = classifyCommonsReuseStatus(license);
  return {
    sourceRecordId: String(page.pageid), canonicalUrl: page.fullurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    title: page.title.replace(/^File:/i, "").replace(/\.[A-Za-z0-9]{2,5}$/, "").replace(/[_-]+/g, " ").trim().slice(0, 500),
    reuseStatus, rightsLabel: license || null, rightsUrl: plain(metadata.LicenseUrl?.value) || null, attribution, sourcePayload: JSON.stringify({ provider: "wikimedia_commons", pageId: page.pageid, title: page.title, license }),
    assets: [{ providerAssetId: String(page.pageid), mediaUrl: image.url, previewUrl: image.thumburl ?? image.url, mimeType: image.mime, creator: attribution, attribution, rightsLabel: license || null, rightsUrl: plain(metadata.LicenseUrl?.value) || null, reuseStatus }],
  };
}
export async function fetchWikimediaStampRecords(query: string, limit: number) {
  const params = new URLSearchParams({ action: "query", format: "json", formatversion: "2", generator: "search", gsrsearch: `${query} filetype:bitmap`, gsrnamespace: "6", gsrlimit: String(limit), prop: "info|imageinfo", inprop: "url", iiprop: "url|mime|extmetadata", iiurlwidth: "900", origin: "*" });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!response.ok) throw new Error(`Wikimedia Commons request failed (${response.status})`);
  const payload = await response.json() as CommonsResponse;
  return Object.values(payload.query?.pages ?? {}).map(mapCommonsPage).filter((record): record is ImportedStampInput => Boolean(record));
}
