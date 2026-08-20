import type { Stamp } from "./catalog";

export type CatalogueOrigin = "seeded" | "external";
export type NormalizedCondition = "Mint" | "Fine used" | "Used" | "FDC" | "Unknown";

export type NormalizedStamp = {
  id: string; slug: string; title: string; country: string; countryCode: string; year: number | null; decade: string | null; topic: string; series: string | null; denomination: string | null; color: string | null; image: string; imageAlt: string; description: string | null; historicalContext: string | null; perforation: string | null; watermark: string | null; printingMethod: string | null; printRun: string | null; catalogueReference: string | null; condition: NormalizedCondition; distinguishingFeatures: string[]; sourceCredit: string | null; sourceUrl: string; provenance: { provider: string; rightsLabel: string | null; attribution: string | null; publishStatus: "Seeded verified" | "Approved import" }; origin: CatalogueOrigin;
};

export type PublishedExternalStamp = {
  id: number; externalStampRecordId: number; slug: string; provider: "wikimedia_commons" | "smithsonian"; canonicalUrl: string; title: string; country: string | null; normalizedCountry?: string | null; issueDate: string | null; eraDecade?: string | null; denomination: string | null; description: string | null; rightsLabel: string | null; attribution: string | null; assets: Array<{ mediaUrl: string; previewUrl: string | null; creator: string | null; attribution: string | null; rightsLabel: string | null }>;
};

function yearFromIssueDate(value: string | null) { const match = value?.match(/\b(1[5-9]\d{2}|20\d{2})\b/); return match ? Number(match[1]) : null; }
function countryCodeFromName(country: string) { const lookup: Record<string, string> = { "United States": "US", "United Kingdom": "GB", France: "FR", Japan: "JP", Brazil: "BR", Egypt: "EG", Australia: "AU", Canada: "CA" }; return lookup[country] ?? "--"; }

export function normalizeSeededStamp(stamp: Stamp): NormalizedStamp {
  return { id: stamp.id, slug: stamp.slug, title: stamp.title, country: stamp.country, countryCode: stamp.countryCode, year: stamp.year, decade: stamp.decade, topic: stamp.topic, series: stamp.series, denomination: stamp.denomination, color: stamp.color, image: stamp.image, imageAlt: stamp.imageAlt, description: stamp.description, historicalContext: stamp.historicalContext, perforation: stamp.perforation, watermark: stamp.watermark, printingMethod: stamp.printingMethod, printRun: stamp.printRun, catalogueReference: stamp.catalogueReference, condition: stamp.condition, distinguishingFeatures: stamp.distinguishingFeatures, sourceCredit: stamp.sourceCredit, sourceUrl: stamp.sourceUrl, provenance: stamp.provenance, origin: "seeded" };
}

export function normalizeExternalStamp(record: PublishedExternalStamp): NormalizedStamp {
  const image = record.assets.find((asset) => asset.previewUrl || asset.mediaUrl);
  const country = record.normalizedCountry || record.country || "Country unavailable";
  const year = yearFromIssueDate(record.issueDate);
  const provider = record.provider === "wikimedia_commons" ? "Wikimedia Commons" : "Smithsonian";
  return { id: `external-${record.id}`, slug: record.slug, title: record.title, country, countryCode: countryCodeFromName(country), year, decade: record.eraDecade || (year ? `${Math.floor(year / 10) * 10}s` : null), topic: "Unclassified", series: null, denomination: record.denomination, color: null, image: image?.previewUrl || image?.mediaUrl || "", imageAlt: record.title, description: record.description, historicalContext: null, perforation: null, watermark: null, printingMethod: null, printRun: null, catalogueReference: null, condition: "Unknown", distinguishingFeatures: [record.country ? `Source country: ${record.country}` : "Country unavailable", record.issueDate ? `Source issue date: ${record.issueDate}` : "Issue date unavailable"], sourceCredit: image?.creator || record.attribution || null, sourceUrl: record.canonicalUrl, provenance: { provider, rightsLabel: record.rightsLabel || image?.rightsLabel || null, attribution: record.attribution || image?.attribution || null, publishStatus: "Approved import" }, origin: "external" };
}

export function isVisibleCatalogueStamp(stamp: NormalizedStamp) { return Boolean(stamp.image) && Boolean(stamp.sourceUrl); }
