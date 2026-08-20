import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { ImportReviewCard } from "@/components/ImportReviewCard";
import { MetadataHistoryPanel } from "@/components/MetadataHistoryPanel";
import { trpc } from "@/lib/trpc";
import { LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

const filters = ["all", "pending", "approved", "rejected"] as const;
type Filter = (typeof filters)[number];

const capability = {
  reviewer: "Review imports, correct metadata, and approve or reject records.",
  admin: "All reviewer capabilities plus publishing, importing, and role management.",
};

export default function AdminImports() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<Filter>("pending");
  const [lastEditorId, setLastEditorId] = useState("all");
  const isReviewer = user?.role === "reviewer" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const input = useMemo(() => {
    const reviewStatus = filter === "all" ? undefined : filter;
    const lastUpdatedByUserId = lastEditorId === "all" ? undefined : Number(lastEditorId);
    return reviewStatus || lastUpdatedByUserId ? { reviewStatus, lastUpdatedByUserId } : undefined;
  }, [filter, lastEditorId]);
  const imports = trpc.externalImports.list.useQuery(input, { enabled: isReviewer });
  const pendingSummary = trpc.externalImports.pendingSummary.useQuery(undefined, { enabled: isReviewer });
  const editors = trpc.externalImports.editors.useQuery(undefined, { enabled: isReviewer });
  const accessUsers = trpc.accessControl.listUsers.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const invalidateImports = () => {
    utils.externalImports.list.invalidate();
    utils.externalImports.pendingSummary.invalidate();
    utils.externalImports.history.invalidate();
    utils.externalImports.editors.invalidate();
  };
  const review = trpc.externalImports.review.useMutation({ onSuccess: invalidateImports });
  const updateMetadata = trpc.externalImports.updateMetadata.useMutation({ onSuccess: invalidateImports });
  const publish = trpc.externalImports.publish.useMutation({ onSuccess: invalidateImports });
  const updateRole = trpc.accessControl.updateRole.useMutation({ onSuccess: () => accessUsers.refetch() });

  if (loading) return <div className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-[#426f5a]" /></div>;
  if (!user || !isReviewer) return <AppShell><main className="container grid min-h-[65vh] place-items-center py-16"><div className="max-w-lg rounded-[1.75rem] border border-[#b85d5d]/25 bg-[#fff8f7] p-9 text-center"><ShieldAlert className="mx-auto text-[#af4e4e]" size={28} /><h1 className="mt-5 font-display text-3xl font-semibold">Reviewer access required</h1><p className="mt-3 text-sm leading-6 text-[#6a5e59]">Only assigned reviewers and administrators can work with imported source records.</p></div></main></AppShell>;

  return <AppShell>
    <main className="min-h-screen bg-[#f7f5f0] py-10 dark:bg-[#10231e]">
      <div className="container">
        <div className="flex flex-col gap-5 border-b border-[#173a34]/10 pb-8 md:flex-row md:items-end md:justify-between dark:border-white/10">
          <div><p className="eyebrow">Editorial control</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.055em] text-[#173a34] dark:text-[#eef4ee]">Imported stamp review</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#60746a] dark:text-[#bcd0c4]">Check provenance, correct country/era classification and confirm image rights before a stamp becomes publicly visible.</p>{pendingSummary.data?.count ? <p className="mt-4 inline-flex rounded-full bg-[#fff1d8] px-3 py-1.5 text-xs font-bold text-[#805d20] dark:bg-[#463b21] dark:text-[#f2d696]">{pendingSummary.data.count} new import{pendingSummary.data.count === 1 ? "" : "s"} waiting for review</p> : null}</div>
          <div className="max-w-lg space-y-3"><div className="flex flex-wrap justify-end gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${filter === item ? "bg-[#173a34] text-white" : "border border-[#173a34]/15 bg-white text-[#466356] hover:bg-[#eaf0e9] dark:border-white/15 dark:bg-white/5 dark:text-[#dbe9de]"}`}>{item}</button>)}</div><label className="block text-right text-xs font-bold text-[#466356] dark:text-[#c8d9ce]">Last updated by<select value={lastEditorId} onChange={(event) => setLastEditorId(event.target.value)} className="ml-2 rounded-full border border-[#173a34]/15 bg-white px-3 py-2 text-xs font-medium text-[#244c3e] dark:border-white/15 dark:bg-white/5 dark:text-white"><option value="all">All reviewers</option>{editors.data?.map((editor) => <option key={editor.id} value={editor.id}>{editor.name || editor.email || `User #${editor.id}`}</option>)}</select></label></div>
        </div>

        <section className="mt-6 rounded-[1.25rem] border border-[#317154]/15 bg-[#ecf5ed] p-4 dark:border-[#8ac89f]/15 dark:bg-[#153528]"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#317154] dark:text-[#8ac89f]" size={20} /><div><p className="text-sm font-bold text-[#244c3e] dark:text-[#dcf3e2]">You are signed in as {user.role}</p><p className="mt-1 text-xs leading-5 text-[#597066] dark:text-[#b8d2bf]">{user.role === "admin" ? capability.admin : capability.reviewer}</p></div></div></section>

        {imports.isLoading ? <div className="grid min-h-[45vh] place-items-center"><LoaderCircle className="animate-spin text-[#426f5a]" /></div> : <div className="mt-8 grid gap-5">{imports.data?.map((record) => <ImportReviewCard key={record.id} record={record} reviewing={review.isPending || updateMetadata.isPending} publishing={publish.isPending} canPublish={isAdmin} history={<MetadataHistoryPanel recordId={record.id} />} onReview={(reviewStatus) => review.mutate({ id: record.id, reviewStatus, reviewNote: "Reviewed in StampAtlas editorial console." })} onSaveMetadata={(metadata) => updateMetadata.mutateAsync({ id: record.id, ...metadata })} onPublish={() => publish.mutate({ id: record.id })} />)}{!imports.data?.length && <div className="rounded-[1.5rem] border border-dashed border-[#173a34]/20 py-20 text-center text-sm text-[#63766c] dark:border-white/20 dark:text-[#bfd0c2]">No imported records match this review state and editor filter.</div>}</div>}

        {isAdmin && <section className="mt-12 border-t border-[#173a34]/10 pt-10 dark:border-white/10"><p className="eyebrow">Access control</p><h2 className="mt-3 font-display text-3xl font-semibold text-[#173a34] dark:text-[#eef4ee]">Reviewer and administrator roles</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#60746a] dark:text-[#bcd0c4]">Reviewers may inspect, edit metadata and decide review status. Administrators alone may publish approved records, create import batches and change access roles.</p><div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[#173a34]/10 bg-white dark:border-white/10 dark:bg-white/[.04]"><div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#173a34]/10 px-4 py-3 text-xs font-bold uppercase tracking-[.12em] text-[#64776d] dark:border-white/10 dark:text-[#b9cbbf]"><span>Team member</span><span>Role</span></div>{accessUsers.data?.map((member) => <div key={member.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#173a34]/10 px-4 py-3 last:border-0 dark:border-white/10"><div><p className="text-sm font-bold text-[#244c3e] dark:text-[#e2f2e6]">{member.name || "Unnamed user"}{member.id === user.id ? " (you)" : ""}</p><p className="text-xs text-[#6a7b72] dark:text-[#b5c7bb]">{member.email || "No email available"}</p></div><select aria-label={`Role for ${member.name || member.email || member.id}`} disabled={member.id === user.id || updateRole.isPending} value={member.role} onChange={(event) => updateRole.mutate({ userId: member.id, role: event.target.value as "user" | "reviewer" | "admin" })} className="rounded-full border border-[#173a34]/15 bg-[#f7faf6] px-3 py-2 text-xs font-bold text-[#244c3e] disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white"><option value="user">User</option><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select></div>)}</div></section>}
      </div>
    </main>
  </AppShell>;
}
