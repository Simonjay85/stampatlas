import { StampVisual } from "@/components/StampVisual";
import type { Stamp } from "@/data/catalog";
import type { NormalizedStamp } from "@/data/normalizedCatalogue";
import { Info } from "lucide-react";
import React from "react";

export function FeaturedStampCard({ stamp, index }: { stamp: Stamp | NormalizedStamp; index: number }) {
  const provenance = stamp.provenance;
  return <article className="catalogue-card group">
    <div className="relative grid aspect-[.98] place-items-center overflow-hidden bg-[#e6ebe2] p-7">
      <StampVisual stamp={stamp} className="h-[210px] w-[165px] transition duration-300 group-hover:-translate-y-2 group-hover:rotate-[-2deg] group-hover:shadow-xl" />
      <span className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#3d584c]">0{index + 1}</span>
      <div className="absolute inset-x-3 bottom-3 translate-y-2 rounded-xl bg-[#173a34]/95 p-3 text-white opacity-0 shadow-lg transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#f3d47e]"><Info size={13} /> Source verified</div>
        <p className="mt-1 text-xs font-semibold">{provenance.provider}</p>
        <dl className="mt-2 grid gap-1 text-[10px] leading-4 text-[#c5d8cc]"><div><dt className="inline font-semibold text-[#f1d989]">Rights: </dt><dd className="inline">{provenance.rightsLabel || "Unavailable"}</dd></div><div><dt className="inline font-semibold text-[#f1d989]">Status: </dt><dd className="inline">{provenance.publishStatus}</dd></div><div><dt className="inline font-semibold text-[#f1d989]">Credit: </dt><dd className="inline">{provenance.attribution || stamp.sourceCredit || "Unavailable"}</dd></div></dl>
      </div>
    </div>
    <div className="p-5"><div className="flex justify-between gap-3 text-xs font-semibold uppercase tracking-[.11em] text-[#718178]"><span>{stamp.country}</span><span>{stamp.year ?? "Year unavailable"}</span></div><h3 className="mt-2 font-display text-xl font-semibold tracking-[-.03em]">{stamp.title}</h3><div className="mt-3 flex items-center justify-between gap-3"><p className="text-sm text-[#63756a]">{stamp.denomination || "Denomination unavailable"}</p><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#658171]">{provenance.provider}</span></div></div>
  </article>;
}
