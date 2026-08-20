import AppShell from "@/components/AppShell";
import { StampVisual } from "@/components/StampVisual";
import { conditions, countries, decades, filterStamps, sources, topics } from "@/data/catalog";
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";

type Filters = { query: string; country: string; decade: string; topic: string; condition: string; source: string };
const initialFilters: Filters = { query: "", country: "All countries", decade: "All eras", topic: "All topics", condition: "All conditions", source: "All sources" };

export default function Explore() {
  const search = useSearch();
  const initialQuery = new URLSearchParams(search).get("q") ?? "";
  const [filters, setFilters] = useState<Filters>({ ...initialFilters, query: initialQuery });
  const results = useMemo(() => filterStamps(filters), [filters]);
  const hasActiveFilter = Object.entries(filters).some(([key, value]) => key === "query" ? Boolean(value) : value !== initialFilters[key as keyof Filters]);

  function update(key: keyof Filters, value: string) { setFilters((current) => ({ ...current, [key]: value })); }

  return <AppShell>
    <main className="container py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div><p className="eyebrow">Public catalogue</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-.055em] text-[#173a34] sm:text-6xl">Browse by curiosity.</h1><p className="mt-4 max-w-xl text-base leading-7 text-[#566a60]">A visual demonstration catalogue with labelled development records, designed to make discovery feel purposeful rather than endless.</p></div>
        <div className="rounded-full bg-[#e4eee4] px-4 py-2 text-sm font-semibold text-[#315b4a]"><span className="font-display text-xl">{results.length}</span> visual records</div>
      </div>

      <section className="mt-10 rounded-[1.4rem] border border-[#173a34]/10 bg-white/75 p-4 shadow-[0_12px_28px_rgba(39,65,50,.05)] sm:p-5" aria-label="Catalogue filters">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="relative block"><span className="sr-only">Search catalogue</span><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b766f]" size={17} /><input value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder="Search by name, country, year..." className="h-11 w-full rounded-xl border border-[#1e302b]/10 bg-[#fbfbf7] pl-10 pr-4 text-sm outline-none focus:border-[#5d887a] focus:ring-4 focus:ring-[#dce8df]" /></label>
          <FilterSelect label="Country" value={filters.country} options={countries} onChange={(value) => update("country", value)} />
          <FilterSelect label="Era" value={filters.decade} options={decades} onChange={(value) => update("decade", value)} />
          <FilterSelect label="Topic" value={filters.topic} options={topics} onChange={(value) => update("topic", value)} />
          <FilterSelect label="Condition" value={filters.condition} options={conditions} onChange={(value) => update("condition", value)} />
          <FilterSelect label="Source" value={filters.source} options={sources} onChange={(value) => update("source", value)} />
          <button type="button" onClick={() => setFilters(initialFilters)} disabled={!hasActiveFilter} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#173a34]/10 px-3 text-sm font-semibold text-[#3b5b4c] transition hover:bg-[#edf3ed] disabled:cursor-not-allowed disabled:opacity-40"><X size={15} /> Clear</button>
        </div>
      </section>

      <div className="mt-8 flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#64786e]"><SlidersHorizontal size={15} /> Showing {results.length} of 40 records</p><p className="hidden text-xs text-[#718178] sm:block">Values are illustrative and are not appraisals.</p></div>
      {results.length ? <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{results.map((stamp) => <Link key={stamp.id} href={`/stamps/${stamp.slug}`} className="catalogue-card group"><div className="relative grid aspect-[1.02] place-items-center overflow-hidden bg-[#e7ede5] p-8"><StampVisual stamp={stamp} className="h-[220px] w-[174px] transition duration-300 group-hover:-translate-y-2 group-hover:rotate-[-2deg] group-hover:shadow-xl" /><span className="absolute right-4 top-4 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#3d584c]">{stamp.condition}</span></div><div className="p-5"><div className="flex justify-between gap-3 text-[11px] font-bold uppercase tracking-[.11em] text-[#718178]"><span>{stamp.country}</span><span>{stamp.year}</span></div><h2 className="mt-2 font-display text-[1.35rem] font-semibold tracking-[-.03em] text-[#1b342b]">{stamp.title}</h2><div className="mt-3 flex items-center justify-between text-sm"><span className="text-[#66786e]">{stamp.denomination} · {stamp.topic}</span><span className="font-semibold text-[#275442]">${stamp.value.mint[0]}–${stamp.value.mint[1]}</span></div></div></Link>)}</section> : <div className="mt-6 grid min-h-[360px] place-items-center rounded-[1.5rem] border border-dashed border-[#78958a]/45 bg-[#edf3ed] p-8 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[#477565]"><Filter size={20} /></div><h2 className="mt-4 font-display text-2xl font-semibold">No stamps in this selection</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#5e7168]">Try a different subject or reset your filters to return to the complete demonstration catalogue.</p><button onClick={() => setFilters(initialFilters)} className="mt-5 text-sm font-semibold text-[#285847] underline underline-offset-4">Reset filters</button></div></div>}
    </main>
  </AppShell>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="relative block"><span className="sr-only">Filter by {label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#1e302b]/10 bg-[#fbfbf7] px-3 pr-8 text-sm text-[#375348] outline-none focus:border-[#5d887a] focus:ring-4 focus:ring-[#dce8df]">{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#63766b]" size={15} /></label>;
}
