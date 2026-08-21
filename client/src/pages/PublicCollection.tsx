import AppShell from "@/components/AppShell";
import { StampVisual } from "@/components/StampVisual";
import { SharePublicLink } from "@/components/SharePublicLink";
import { useCatalogueStampsBySlugs } from "@/hooks/usePublicCatalogue";
import { trpc } from "@/lib/trpc";
import { Globe2, LoaderCircle } from "lucide-react";
import React, { useMemo } from "react";
import { Link, useRoute } from "wouter";

function Unavailable() {
  return <AppShell><main className="container grid min-h-[58vh] place-items-center py-16 text-center"><div><p className="eyebrow justify-center">Public collection unavailable</p><h1 className="mt-4 font-display text-4xl font-semibold">We could not find that public collection.</h1><Link href="/explore" className="mt-6 inline-flex text-sm font-semibold text-[#285847]">Browse the catalogue</Link></div></main></AppShell>;
}

export default function PublicCollection() {
  const [, albumParams] = useRoute("/collections/:username/:collectionSlug");
  const [, profileParams] = useRoute("/collections/:username");
  const username = albumParams?.username ?? profileParams?.username ?? "";
  const requestedAlbumId = albumParams?.collectionSlug ? Number(albumParams.collectionSlug) : null;
  const profileQuery = trpc.profiles.public.useQuery({ username }, { enabled: Boolean(username) });
  const publicData = profileQuery.data;
  const selectedAlbum = requestedAlbumId ? publicData?.albums.find((album) => album.id === requestedAlbumId) ?? null : undefined;
  const selectedAssignments = useMemo(() => (publicData?.assignments ?? []).filter((assignment) => selectedAlbum ? assignment.albumId === selectedAlbum.id : true), [publicData?.assignments, selectedAlbum]);
  const itemById = useMemo(() => new Map((publicData?.items ?? []).map((item) => [item.id, item])), [publicData?.items]);
  const stampSlugs = useMemo(() => selectedAssignments.map((assignment) => itemById.get(assignment.collectionItemId)?.stampSlug).filter((slug): slug is string => Boolean(slug)), [itemById, selectedAssignments]);
  const catalogue = useCatalogueStampsBySlugs(stampSlugs);
  const galleryStamps = stampSlugs.map((slug) => catalogue.bySlug.get(slug)).filter((stamp): stamp is NonNullable<typeof stamp> => Boolean(stamp));

  if (profileQuery.isLoading) return <AppShell><main className="container grid min-h-[58vh] place-items-center py-16"><LoaderCircle className="animate-spin text-[#315746]" aria-label="Loading public collection" /></main></AppShell>;
  if (!publicData || (requestedAlbumId && !selectedAlbum)) return <Unavailable />;

  const title = selectedAlbum ? selectedAlbum.name : `${publicData.profile.displayName}'s collection`;
  return <AppShell><main><section className="border-b border-[#173a34]/10 bg-[#e9eee6]"><div className="container py-14 sm:py-20"><div className="max-w-3xl"><p className="eyebrow"><Globe2 size={14} /> Public collection</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-.06em] text-[#173a34] sm:text-6xl">{title}</h1>{publicData.profile.bio ? <p className="mt-5 max-w-2xl text-base leading-7 text-[#54695e]">{publicData.profile.bio}</p> : null}<div className="mt-7 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-white/75 px-3 py-2 text-[#385948]">{galleryStamps.length} published catalogue stamps</span><span className="rounded-full bg-white/75 px-3 py-2 text-[#385948]">{publicData.albums.length} public albums</span></div></div></div></section><section className="container py-12 sm:py-16"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">{selectedAlbum ? "Selected album" : "Full collection"}</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-.05em]">{title}</h2>{selectedAlbum ? <p className="mt-2 text-sm text-[#64776d]">{selectedAlbum.description}</p> : null}</div><SharePublicLink title={title} text="Explore this public StampAtlas collection." /></div>{catalogue.loading ? <div className="mt-9 flex items-center gap-2 text-sm text-[#63756a]"><LoaderCircle size={16} className="animate-spin" /> Resolving catalogue stamps…</div> : null}<div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{galleryStamps.map((stamp, index) => <Link href={`/stamps/${stamp.slug}`} key={stamp.id} className="catalogue-card group"><div className="relative grid aspect-[.95] place-items-center bg-[#e6ebe2] p-8"><StampVisual stamp={stamp} className="h-[220px] w-[174px] transition duration-300 group-hover:-translate-y-2" /><span className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#3d584c]">{String(index + 1).padStart(2, "0")}</span></div><div className="p-5"><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#718178]">{stamp.country}{stamp.year ? ` · ${stamp.year}` : ""}</p><h3 className="mt-2 font-display text-xl font-semibold">{stamp.title}</h3><p className="mt-2 text-sm text-[#63756a]">{stamp.provenance.provider} · {stamp.provenance.publishStatus}</p></div></Link>)}</div>{!catalogue.loading && !galleryStamps.length ? <p className="mt-9 rounded-2xl border border-dashed border-[#173a34]/15 bg-[#f7f5f0] p-6 text-sm text-[#63756a]">This public album does not currently contain a published catalogue stamp.</p> : null}<div className="mt-10 flex flex-wrap gap-3 border-t border-[#173a34]/10 pt-6"><Link href={`/collections/${publicData.profile.username}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${!selectedAlbum ? "bg-[#173a34] text-white" : "border border-[#173a34]/15 bg-white text-[#315848]"}`}>All public albums</Link>{publicData.albums.map((album) => <Link key={album.id} href={`/collections/${publicData.profile.username}/${album.id}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedAlbum?.id === album.id ? "bg-[#173a34] text-white" : "border border-[#173a34]/15 bg-white text-[#315848]"}`}>{album.name}</Link>)}</div></section></main></AppShell>;
}
