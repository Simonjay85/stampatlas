import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { reorderIds } from "@/data/collectionLogic";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type CollectionCondition = "Mint" | "Fine used" | "Used" | "FDC";
export type CollectionStatus = "owned" | "wishlist" | "duplicate" | "swap";
export type CollectionGrade = "superb" | "very_fine" | "fine" | "average" | "damaged" | "ungraded";
export type CollectionItem = { id: string; stampSlug: string; condition: CollectionCondition; quantity: number; collectionStatus: CollectionStatus; grade: CollectionGrade; purchasePrice: number; acquiredAt: string; acquisitionSource: string | null; storageLocation: string | null; albumPage: number | null; customTags: string[]; frontImageUrl: string | null; backImageUrl: string | null; notes: string };
export type Album = { id: string; name: string; description: string; coverStampSlug: string; visibility: "private" | "public"; itemIds: string[] };

type CollectionDemoContextValue = {
  items: CollectionItem[];
  albums: Album[];
  isLoading: boolean;
  addStamp: (stampSlug: string, collectionStatus?: CollectionStatus) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, patch: Partial<Omit<CollectionItem, "id" | "stampSlug">>) => void;
  createAlbum: (name: string, description: string) => void;
  assignItem: (itemId: string, albumId: string | null) => void;
  moveAlbumItem: (albumId: string, itemId: string, direction: -1 | 1) => void;
  setAlbumCover: (albumId: string, stampSlug: string) => void;
  setAlbumVisibility: (albumId: string, visibility: "private" | "public") => void;
};

const CollectionDemoContext = createContext<CollectionDemoContextValue | null>(null);
const fallbackItems: CollectionItem[] = [];
const fallbackAlbums: Album[] = [];

export function CollectionDemoProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [localItems, setLocalItems] = useState(fallbackItems);
  const [localAlbums, setLocalAlbums] = useState(fallbackAlbums);
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
  const persistedItems = useMemo<CollectionItem[]>(() => (itemsQuery.data ?? []).map((item) => ({ id: String(item.id), stampSlug: item.stampSlug, condition: item.condition, quantity: item.quantity, collectionStatus: item.collectionStatus, grade: item.grade, purchasePrice: Number(item.purchasePrice), acquiredAt: new Date(item.acquiredAt).toISOString().slice(0, 10), acquisitionSource: item.acquisitionSource, storageLocation: item.storageLocation, albumPage: item.albumPage, customTags: item.customTags ? safeTags(item.customTags) : [], frontImageUrl: item.frontImageUrl, backImageUrl: item.backImageUrl, notes: item.notes })), [itemsQuery.data]);
  const persistedAlbums = useMemo<Album[]>(() => (albumsQuery.data?.albums ?? []).map((album) => ({ id: String(album.id), name: album.name, description: album.description, coverStampSlug: album.coverStampSlug, visibility: album.visibility, itemIds: (albumsQuery.data?.assignments ?? []).filter((assignment) => assignment.albumId === album.id).sort((a, b) => a.position - b.position).map((assignment) => String(assignment.collectionItemId)) })), [albumsQuery.data]);
  const items = hasServerData ? persistedItems : localItems;
  const albums = hasServerData ? persistedAlbums : localAlbums;

  const value = useMemo<CollectionDemoContextValue>(() => ({
    items,
    albums,
    isLoading: loading,
    addStamp(stampSlug, collectionStatus = "owned") {
      const newItem: CollectionItem = { id: `local-${Date.now()}`, stampSlug, condition: "Mint", quantity: 1, collectionStatus, grade: "ungraded", purchasePrice: 0, acquiredAt: new Date().toISOString().slice(0, 10), acquisitionSource: null, storageLocation: null, albumPage: null, customTags: [], frontImageUrl: null, backImageUrl: null, notes: "" };
      if (!hasServerData) setLocalItems((current) => [newItem, ...current]);
      createItem.mutate({ stampSlug, condition: "Mint", quantity: 1, collectionStatus, grade: "ungraded", purchasePrice: 0, acquiredAt: newItem.acquiredAt, customTags: [], notes: "" });
    },
    removeItem(itemId) {
      if (!hasServerData) { setLocalItems((current) => current.filter((item) => item.id !== itemId)); setLocalAlbums((current) => current.map((album) => ({ ...album, itemIds: album.itemIds.filter((id) => id !== itemId) }))); }
      if (Number(itemId) > 0) removeItemMutation.mutate({ id: Number(itemId) });
    },
    updateItem(itemId, patch) {
      if (!hasServerData) setLocalItems((current) => current.map((item) => item.id === itemId ? { ...item, ...patch } : item));
      if (Number(itemId) > 0) updateItemMutation.mutate({ id: Number(itemId), ...patch });
    },
    createAlbum(name, description) {
      const cleanName = name.trim();
      if (!cleanName) return;
      const newAlbum: Album = { id: `local-album-${Date.now()}`, name: cleanName, description: description.trim() || "A new StampAtlas album.", coverStampSlug: items[0]?.stampSlug || "unassigned-cover", visibility: "private", itemIds: [] };
      if (!hasServerData) setLocalAlbums((current) => [...current, newAlbum]);
      createAlbumMutation.mutate({ name: newAlbum.name, description: newAlbum.description, coverStampSlug: newAlbum.coverStampSlug, visibility: newAlbum.visibility });
    },
    assignItem(itemId, albumId) {
      const album = albums.find((entry) => entry.id === albumId);
      if (!hasServerData) setLocalAlbums((current) => current.map((entry) => ({ ...entry, itemIds: entry.id === albumId ? (entry.itemIds.includes(itemId) ? entry.itemIds : [...entry.itemIds, itemId]) : entry.itemIds.filter((id) => id !== itemId) })));
      if (Number(itemId) > 0) assignItemMutation.mutate({ collectionItemId: Number(itemId), albumId: albumId && Number(albumId) > 0 ? Number(albumId) : null, position: album?.itemIds.length || 0 });
    },
    moveAlbumItem(albumId, itemId, direction) {
      const album = albums.find((entry) => entry.id === albumId);
      if (!album) return;
      const reordered = reorderIds(album.itemIds, itemId, direction);
      if (reordered === album.itemIds) return;
      if (!hasServerData) setLocalAlbums((current) => current.map((entry) => entry.id === albumId ? { ...entry, itemIds: reordered } : entry));
      if (Number(albumId) > 0) reorderItemsMutation.mutate({ albumId: Number(albumId), collectionItemIds: reordered.map(Number) });
    },
    setAlbumCover(albumId, stampSlug) {
      if (!hasServerData) setLocalAlbums((current) => current.map((album) => album.id === albumId ? { ...album, coverStampSlug: stampSlug } : album));
      if (Number(albumId) > 0) updateAlbumMutation.mutate({ id: Number(albumId), coverStampSlug: stampSlug });
    },
    setAlbumVisibility(albumId, visibility) {
      if (!hasServerData) setLocalAlbums((current) => current.map((album) => album.id === albumId ? { ...album, visibility } : album));
      if (Number(albumId) > 0) updateAlbumMutation.mutate({ id: Number(albumId), visibility });
    },
  }), [albums, assignItemMutation, createAlbumMutation, createItem, hasServerData, items, loading, localAlbums, localItems, removeItemMutation, reorderItemsMutation, updateAlbumMutation, updateItemMutation]);

  return <CollectionDemoContext.Provider value={value}>{children}</CollectionDemoContext.Provider>;
}

export function useCollectionDemo() {
  const context = useContext(CollectionDemoContext);
  if (!context) throw new Error("useCollectionDemo must be used within CollectionDemoProvider");
  return context;
}

function safeTags(value: string) { try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : []; } catch { return []; } }
