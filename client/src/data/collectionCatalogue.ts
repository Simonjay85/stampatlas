import type { NormalizedStamp } from "./normalizedCatalogue";

export function resolveCollectionCatalogueItems<T extends { stampSlug: string }>(items: T[], bySlug: Map<string, NormalizedStamp>) {
  return items.flatMap((item) => {
    const stamp = bySlug.get(item.stampSlug);
    return stamp ? [{ item, stamp }] : [];
  });
}
