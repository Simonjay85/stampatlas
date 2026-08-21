export type SmithsonianFileRecord = {
  sourceRecordId: string;
  canonicalUrl: string;
  title: string;
  country?: string | null;
  issueDate?: string | null;
  denomination?: string | null;
  description?: string | null;
  reuseStatus: "public_domain" | "cc_by" | "permission_granted" | "metadata_only" | "needs_review" | "blocked";
  rightsLabel?: string | null;
  rightsUrl?: string | null;
  attribution?: string | null;
  sourcePayload: string;
  assets: Array<{
    providerAssetId: string;
    mediaUrl: string;
    previewUrl?: string | null;
    mimeType?: string | null;
    creator?: string | null;
    attribution?: string | null;
    rightsLabel?: string | null;
    rightsUrl?: string | null;
    reuseStatus: "public_domain" | "cc_by" | "permission_granted" | "metadata_only" | "needs_review" | "blocked";
  }>;
};

const allowedReuseStatuses = new Set(["public_domain", "cc_by", "permission_granted", "metadata_only", "needs_review", "blocked"]);

function nullableString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function httpsUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeReuseStatus(value: unknown) {
  return typeof value === "string" && allowedReuseStatuses.has(value) ? value as SmithsonianFileRecord["reuseStatus"] : "needs_review";
}

function sourceRows(parsed: unknown) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { records?: unknown[] }).records)) return (parsed as { records: unknown[] }).records;
  throw new Error("The file must be a JSON array or an object with a records array");
}

function mapAsset(raw: Record<string, unknown>, recordId: string, index: number, record: Record<string, unknown>) {
  const mediaUrl = httpsUrl(raw.mediaUrl ?? raw.url ?? raw.imageUrl ?? (raw.resources as Array<{ url?: unknown }> | undefined)?.[0]?.url);
  if (!mediaUrl) return null;
  const rightsLabel = nullableString(raw.rightsLabel ?? raw.rights, 255) ?? nullableString(record.rightsLabel ?? record.rights, 255);
  const rightsUrl = httpsUrl(raw.rightsUrl) ?? httpsUrl(record.rightsUrl);
  return {
    providerAssetId: nullableString(raw.providerAssetId ?? raw.id, 255) ?? `${recordId}:asset:${index + 1}`,
    mediaUrl,
    previewUrl: httpsUrl(raw.previewUrl ?? raw.thumbnailUrl),
    mimeType: nullableString(raw.mimeType, 120),
    creator: nullableString(raw.creator, 4000),
    attribution: nullableString(raw.attribution, 8000) ?? nullableString(record.attribution, 8000) ?? "Smithsonian Institution",
    rightsLabel,
    rightsUrl,
    reuseStatus: safeReuseStatus(raw.reuseStatus),
  };
}

export function parseSmithsonianOpenAccessFile(fileText: string): SmithsonianFileRecord[] {
  if (fileText.length > 600_000) throw new Error("The import file exceeds the 600 KB intake limit");
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    throw new Error("The selected file is not valid JSON");
  }
  const rows = sourceRows(parsed);
  if (!rows.length || rows.length > 100) throw new Error("The file must contain between 1 and 100 records");
  return rows.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Record ${index + 1} is not an object`);
    const raw = item as Record<string, unknown>;
    const descriptive = raw.content && typeof raw.content === "object" ? (raw.content as Record<string, unknown>).descriptiveNonRepeating as Record<string, unknown> | undefined : undefined;
    const id = nullableString(raw.sourceRecordId ?? raw.id ?? raw.recordId, 255);
    const title = nullableString(raw.title, 500);
    const canonicalUrl = httpsUrl(raw.canonicalUrl ?? raw.recordLink ?? descriptive?.record_link) ?? (id ? `https://www.si.edu/object/${encodeURIComponent(id)}` : null);
    if (!id || !title || !canonicalUrl) throw new Error(`Record ${index + 1} needs id, title and an HTTPS canonical URL or a valid id`);
    const rawAssets = Array.isArray(raw.assets) ? raw.assets : Array.isArray(raw.media) ? raw.media : [];
    const assets = rawAssets.flatMap((asset, assetIndex) => asset && typeof asset === "object" ? [mapAsset(asset as Record<string, unknown>, id, assetIndex, raw)].filter(Boolean) : []) as SmithsonianFileRecord["assets"];
    return {
      sourceRecordId: id,
      canonicalUrl,
      title,
      country: nullableString(raw.country, 160),
      issueDate: nullableString(raw.issueDate ?? raw.date, 64),
      denomination: nullableString(raw.denomination, 80),
      // Imported source prose is not copied into public-facing editorial content.
      description: null,
      reuseStatus: safeReuseStatus(raw.reuseStatus),
      rightsLabel: nullableString(raw.rightsLabel ?? raw.rights, 255),
      rightsUrl: httpsUrl(raw.rightsUrl),
      attribution: nullableString(raw.attribution, 8000) ?? "Smithsonian Institution",
      sourcePayload: JSON.stringify(raw),
      assets,
    };
  });
}
