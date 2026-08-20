import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { ImportReviewCard } from "@/components/ImportReviewCard";
import { trpc } from "@/lib/trpc";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

const filters = ["all", "pending", "approved", "rejected"] as const;
type Filter = (typeof filters)[number];

export default function AdminImports() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<Filter>("pending");
  const input = useMemo(() => filter === "all" ? undefined : { reviewStatus: filter }, [filter]);
  const imports = trpc.externalImports.list.useQuery(input, { enabled: !!user && user.role === "admin" });
  const utils = trpc.useUtils();
  const review = trpc.externalImports.review.useMutation({ onSuccess: () => utils.externalImports.list.invalidate() });
  const publish = trpc.externalImports.publish.useMutation({ onSuccess: () => utils.externalImports.list.invalidate() });

  if (loading) return <div className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-[#426f5a]" /></div>;
  if (!user || user.role !== "admin") return <AppShell><main className="container grid min-h-[65vh] place-items-center py-16"><div className="max-w-lg rounded-[1.75rem] border border-[#b85d5d]/25 bg-[#fff8f7] p-9 text-center"><ShieldAlert className="mx-auto text-[#af4e4e]" size={28} /><h1 className="mt-5 font-display text-3xl font-semibold">Administrator access required</h1><p className="mt-3 text-sm leading-6 text-[#6a5e59]">Imported source records can only be reviewed and published by an administrator.</p></div></main></AppShell>;

  return <AppShell>
    <main className="min-h-screen bg-[#f7f5f0] py-10 dark:bg-[#10231e]">
      <div className="container">
        <div className="flex flex-col gap-5 border-b border-[#173a34]/10 pb-8 md:flex-row md:items-end md:justify-between dark:border-white/10">
          <div><p className="eyebrow">Editorial control</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.055em] text-[#173a34] dark:text-[#eef4ee]">Imported stamp review</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#60746a] dark:text-[#bcd0c4]">Check provenance, automatic country/era classification and image rights before a stamp becomes publicly visible.</p></div>
          <div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[.12em] transition ${filter === item ? "bg-[#173a34] text-white" : "border border-[#173a34]/15 bg-white text-[#466356] hover:bg-[#eaf0e9] dark:border-white/15 dark:bg-white/5 dark:text-[#dbe9de]"}`}>{item}</button>)}</div>
        </div>
        {imports.isLoading ? <div className="grid min-h-[45vh] place-items-center"><LoaderCircle className="animate-spin text-[#426f5a]" /></div> : <div className="mt-8 grid gap-5">{imports.data?.map((record) => <ImportReviewCard key={record.id} record={record} reviewing={review.isPending} publishing={publish.isPending} onReview={(reviewStatus) => review.mutate({ id: record.id, reviewStatus, reviewNote: "Reviewed in StampAtlas editorial console." })} onPublish={() => publish.mutate({ id: record.id })} />)}{!imports.data?.length && <div className="rounded-[1.5rem] border border-dashed border-[#173a34]/20 py-20 text-center text-sm text-[#63766c] dark:border-white/20 dark:text-[#bfd0c2]">No imported records match this review state.</div>}</div>}
      </div>
    </main>
  </AppShell>;
}
