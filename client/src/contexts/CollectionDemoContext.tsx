import { useAuth } from "@/_core/hooks/useAuth";
import { stamps } from "@/data/catalog";
import { trpc } from "@/lib/trpc";
import { reorderIds } from "@/data/collectionLogic";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type CollectionCondition = "Mint" | "Fine used" | "Used" | "FDC";
export type CollectionItem = { id: string; stampSlug: string; condition: CollectionCondition; purchasePrice: number; acquiredAt: string; notes: string };
export type Album = { id: string; name: string; description: string; coverStampSlug: string; itemIds: string[] };

type CollectionDemoContextValue = {
  items: CollectionItem[];
  albums: Album[];
  isLoading: boolean;
  addStamp: (stampSlug: string) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, patch: Partial<Omit<CollectionItem, "id" | "stampSlug">>) => void;
  createAlbum: (name: string, description: string) => void;
  assignItem: (itemId: string, albumId: string | null) => void;
  moveAlbumItem: (albumId: string, itemId: string, direction: -1 | 1) => void;
  setAlbumCover: (albumId: string, stampSlug: string) => void;
};

const CollectionDemoContext = createContext<CollectionDemoContextValue | null>(null);
const seededItems: CollectionItem[] = [
  { id: "-1", stampSlug: "flag-over-capitol", condition: "Mint", purchasePrice: 18, acquiredAt: "2026-08-12", notes: "Crisp margins; acquired from a local club exchange." },
  { id: "-2", stampSlug: "paper-crane", condition: "Fine used", purchasePrice: 12, acquiredAt: "2026-08-08", notes: "Light cancellation, strong colour." },
  { id: "-3", stampSlug: "coral-reef", condition: "Mint", purchasePrice: 24, acquiredAt: "2026-07-30", notes: "Part of a small topical grouping." },
  { id: "-4", stampSlug: "maple-message", condition: "Used", purchasePrice: 7, acquiredAt: "2026-07-19", notes: "A favourite Canadian design study." },
  { id: "-5", stampSlug: "garden-orchid", condition: "Mint", purchasePrice: 29, acquiredAt: "2026-07-11", notes: "Clean example from the botanical album." },
  { id: "-6", stampSlug: "northern-pine", condition: "Fine used", purchasePrice: 8, acquiredAt: "2026-06-28", notes: "Visible circular cancel." },
];
const seededAlbums: Album[] = [
  { id: "-1", name: "Modern icons", description: "Civic symbols and visual studies from a changing world.", coverStampSlug: "flag-over-capitol", itemIds: ["-1", "-2", "-3"] },
  { id: "-2", name: "Small horizons", description: "Flora, forests, and quieter landscape studies.", coverStampSlug: "garden-orchid", itemIds: ["-5", "-6"] },
];

export function CollectionDemoProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [fallbackItems, setFallbackItems] = useState(seededItems);
  const [fallbackAlbums, setFallbackAlbums] = useState(seededAlbums);
  const queryOptions = { enabled: Boolean(user) && !loading, refetchOnMount: true } as const;
  const itemsQuery = trpc.collection.list.useQuery(undefined, queryOptions);
  const albumsQuery = trpc.albums.list.useQuery(undefined, queryOptions);
  const invalidate = () => Promise.all([utils.collection.list.invalidate(), utils.albums.list.invalidate()]);
  const createItem = trpc.collection.create.useMutation({ onSuccess: invalidate });
  const updateItemMutation = trpc.collection.update.useMutation({ onSuccess: invalidate });
  const removeItemMutation = trpc.collection.remove.useMutation({ onSuccess: invalidate });
  const createAlbumMutation = trpc.albums.create.useMutation({ onSuccess: invalidate });
  const updateAlbumMutation = trpc.albums.update.useMutation({ onSuccess: invalidate });
  const assignItemMutation = trpc.albums.assignItem.useMutation({ onSuccess: invalidate });
  const reorderItemsMutation = trpc.albums.reorderItems.useMutation({ onSuccess: invalidate });
  const hasServerData = itemsQuery.data !== undefined && albumsQuery.data !== undefined;
  const persistedItems = useMemo<CollectionItem[]>(() => (itemsQuery.data ?? []).map((item) => ({ id: String(item.id), stampSlug: item.stampSlug, condition: item.condition, purchasePrice: Number(item.purchasePrice), acquiredAt: new Date(item.acquiredAt).toISOString().slice(0, 10), notes: item.notes })), [itemsQuery.data]);
  const persistedAlbums = useMemo<Album[]>(() => (albumsQuery.data?.albums ?? []).map((album) => ({ id: String(album.id), name: album.name, description: album.description, coverStampSlug: album.coverStampSlug, itemIds: (albumsQuery.data?.assignments ?? []).filter((assignment) => assignment.albumId === album.id).sort((a, b) => a.position - b.position).map((assignment) => String(assignment.collectionItemId)) })), [albumsQuery.data]);
  const items = hasServerData ? persistedItems : fallbackItems;
  const albums = hasServerData ? persistedAlbums : fallbackAlbums;

  const value = useMemo<CollectionDemoContextValue>(() => ({
    items,
    albums,
    isLoading: loading,
    addStamp(stampSlug) {
      const newItem: CollectionItem = { id: `local-${Date.now()}`, stampSlug, condition: "Mint", purchasePrice: 0, acquiredAt: new Date().toISOString().slice(0, 10), notes: "" };
      if (!hasServerData) setFallbackItems((current) => [newItem, ...current]);
      createItem.mutate({ stampSlug, condition: "Mint", purchasePrice: 0, acquiredAt: newItem.acquiredAt, notes: "" });
    },
    removeItem(itemId) {
      if (!hasServerData) { setFallbackItems((current) => current.filter((item) => item.id !== itemId)); setFallbackAlbums((current) => current.map((album) => ({ ...album, itemIds: album.itemIds.filter((id) => id !== itemId) }))); }
      if (Number(itemId) > 0) removeItemMutation.mutate({ id: Number(itemId) });
    },
    updateItem(itemId, patch) {
      if (!hasServerData) setFallbackItems((current) => current.map((item) => item.id === itemId ? { ...item, ...patch } : item));
      if (Number(itemId) > 0) updateItemMutation.mutate({ id: Number(itemId), ...patch });
    },
    createAlbum(name, description) {
      const cleanName = name.trim();
      if (!cleanName) return;
      const newAlbum: Album = { id: `local-album-${Date.now()}`, name: cleanName, description: description.trim() || "A new StampAtlas album.", coverStampSlug: items[0]?.stampSlug || stamps[0].slug, itemIds: [] };
      if (!hasServerData) setFallbackAlbums((current) => [...current, newAlbum]);
      createAlbumMutation.mutate({ name: newAlbum.name, description: newAlbum.description, coverStampSlug: newAlbum.coverStampSlug });
    },
    assignItem(itemId, albumId) {
      const album = albums.find((entry) => entry.id === albumId);
      if (!hasServerData) setFallbackAlbums((current) => current.map((entry) => ({ ...entry, itemIds: entry.id === albumId ? (entry.itemIds.includes(itemId) ? entry.itemIds : [...entry.itemIds, itemId]) : entry.itemIds.filter((id) => id !== itemId) })));
      if (Number(itemId) > 0) assignItemMutation.mutate({ collectionItemId: Number(itemId), albumId: albumId && Number(albumId) > 0 ? Number(albumId) : null, position: album?.itemIds.length || 0 });
    },
    moveAlbumItem(albumId, itemId, direction) {
      const album = albums.find((entry) => entry.id === albumId);
      if (!album) return;
      const reordered = reorderIds(album.itemIds, itemId, direction);
      if (reordered === album.itemIds) return;
      if (!hasServerData) setFallbackAlbums((current) => current.map((entry) => entry.id === albumId ? { ...entry, itemIds: reordered } : entry));
      if (Number(albumId) > 0) reorderItemsMutation.mutate({ albumId: Number(albumId), collectionItemIds: reordered.map(Number) });
    },
    setAlbumCover(albumId, stampSlug) {
      if (!hasServerData) setFallbackAlbums((current) => current.map((album) => album.id === albumId ? { ...album, coverStampSlug: stampSlug } : album));
      if (Number(albumId) > 0) updateAlbumMutation.mutate({ id: Number(albumId), coverStampSlug: stampSlug });
    },
  }), [albums, assignItemMutation, createAlbumMutation, createItem, fallbackAlbums, fallbackItems, hasServerData, items, loading, removeItemMutation, reorderItemsMutation, updateAlbumMutation, updateItemMutation]);

  return <CollectionDemoContext.Provider value={value}>{children}</CollectionDemoContext.Provider>;
}

export function useCollectionDemo() {
  const context = useContext(CollectionDemoContext);
  if (!context) throw new Error("useCollectionDemo must be used within CollectionDemoProvider");
  return context;
}
