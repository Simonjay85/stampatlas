import { type CatalogFilter } from "@/data/catalog";
import { type NormalizedStamp } from "@/data/normalizedCatalogue";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export type PublicCatalogueFilters = CatalogFilter & { page?: number };

function active(value: string | undefined, all: string) {
  return value && value !== all ? value : undefined;
}

export function usePublicCatalogue(filters: PublicCatalogueFilters = {}) {
  const serverInput = useMemo(() => ({
    query: filters.query?.trim() || undefined,
    country: active(filters.country, "All countries"),
    decade: active(filters.decade, "All eras"),
    provider: filters.source === "Wikimedia Commons" ? "wikimedia_commons" as const : filters.source === "Smithsonian" ? "smithsonian" as const : undefined,
    page: filters.page ?? 0,
    limit: 24,
  }), [filters.country, filters.decade, filters.page, filters.query, filters.source]);
  const catalogueQuery = trpc.catalogue.list.useQuery({ ...serverInput, topic: active(filters.topic, "All topics"), condition: active(filters.condition, "All conditions") as "Mint" | "Fine used" | "Used" | "FDC" | undefined, source: active(filters.source, "All sources") as "Wikimedia Commons" | "Smithsonian" | "Public-domain archive" | undefined });
  return { stamps: (catalogueQuery.data?.items ?? []) as NormalizedStamp[], externalLoading: catalogueQuery.isLoading, externalError: catalogueQuery.error, nextPage: catalogueQuery.data?.nextPage ?? null };
}

export function usePublicStamp(slug: string) {
  const catalogueQuery = trpc.catalogue.bySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  return { stamp: catalogueQuery.data as NormalizedStamp | null | undefined, externalLoading: catalogueQuery.isLoading, externalError: catalogueQuery.error };
}

export function useCatalogueStampsBySlugs(slugs: string[]) {
  const stableSlugs = useMemo(() => Array.from(new Set(slugs)).sort(), [slugs.join("|")]);
  const query = trpc.catalogue.bySlugs.useQuery({ slugs: stableSlugs }, { enabled: stableSlugs.length > 0 });
  const bySlug = useMemo(() => new Map(((query.data ?? []) as NormalizedStamp[]).map((stamp) => [stamp.slug, stamp])), [query.data]);
  return { bySlug, loading: query.isLoading, error: query.error };
}
