import { Check, ExternalLink, Eye, Sparkles, X } from "lucide-react";
import React from "react";

export type ImportReviewRecord = {
  id: number;
  provider: string;
  title: string;
  country: string | null;
  normalizedCountry: string | null;
  eraDecade: string | null;
  classificationConfidence: number;
  reuseStatus: string;
  reviewStatus: string;
  attribution: string | null;
  canonicalUrl: string;
  assets: Array<{ previewUrl: string | null }>;
};

export function ImportReviewCard({ record, reviewing, publishing, onReview, onPublish }: { record: ImportReviewRecord; reviewing: boolean; publishing: boolean; onReview: (status: "approved" | "rejected") => void; onPublish: () => void }) {
  const asset = record.assets[0];
  const canPublish = record.reviewStatus === "approved" && ["public_domain", "cc_by", "permission_granted"].includes(record.reuseStatus);
  return <article className="grid gap-5 rounded-[1.5rem] border border-[#173a34]/10 bg-white p-5 shadow-[0_14px_36px_rgba(27,61,48,.06)] md:grid-cols-[160px_1fr_auto] dark:border-white/10 dark:bg-white/[.04]">
    <div className="grid min-h-[180px] place-items-center overflow-hidden rounded-2xl bg-[#e7eee7] p-4 dark:bg-[#18332b]">{asset?.previewUrl ? <img src={asset.previewUrl} alt={record.title} className="max-h-[170px] max-w-full object-contain" /> : <Sparkles className="text-[#6f9180]" />}</div>
    <div><div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[.13em]"><span className="rounded-full bg-[#e6f1e6] px-2.5 py-1 text-[#32684d]">{record.provider.replace("_", " ")}</span><span className="rounded-full bg-[#edf0ea] px-2.5 py-1 text-[#52675d]">{record.reviewStatus}</span><span className="rounded-full bg-[#fbf0d9] px-2.5 py-1 text-[#8c6926]">{record.reuseStatus.replaceAll("_", " ")}</span></div><h2 className="mt-3 font-display text-2xl font-semibold text-[#173a34] dark:text-[#f0f5ef]">{record.title}</h2><div className="mt-3 grid gap-2 text-sm text-[#5d7167] sm:grid-cols-3 dark:text-[#bbd0c2]"><span><b>Country:</b> {record.normalizedCountry || record.country || "Unclassified"}</span><span><b>Era:</b> {record.eraDecade || "Unclassified"}</span><span><b>Confidence:</b> {record.classificationConfidence}%</span></div><p className="mt-4 text-sm leading-6 text-[#65776d] dark:text-[#b7cbc0]">{record.attribution || "Attribution pending review"}</p><a href={record.canonicalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#317154] hover:underline">View source <ExternalLink size={13} /></a></div>
    <div className="flex flex-row gap-2 md:flex-col md:justify-center"><button onClick={() => onReview("approved")} disabled={record.reviewStatus === "approved" || reviewing} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1e6248] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><Check size={14} /> Approve</button><button onClick={() => onReview("rejected")} disabled={record.reviewStatus === "rejected" || reviewing} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#b65c5c]/30 px-3 py-2 text-xs font-bold text-[#a44d4d] disabled:opacity-40"><X size={14} /> Reject</button><button onClick={onPublish} disabled={!canPublish || publishing} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#173a34]/20 px-3 py-2 text-xs font-bold text-[#244c3e] disabled:opacity-40 dark:border-white/20 dark:text-[#dff0e3]"><Eye size={14} /> Publish</button></div>
  </article>;
}
