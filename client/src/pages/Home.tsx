import AppShell from "@/components/AppShell";
import { StampVisual } from "@/components/StampVisual";
import { FeaturedStampCard } from "@/components/FeaturedStampCard";
import { countries, decades, featuredStamps, sources } from "@/data/catalog";
import { usePublicCatalogue } from "@/hooks/usePublicCatalogue";
import { ArrowRight, CheckCircle2, Layers3, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const [heroStamp, secondStamp, thirdStamp] = featuredStamps;
  const [country, setCountry] = useState("All countries");
  const [decade, setDecade] = useState("All eras");
  const [source, setSource] = useState("All sources");
  const { stamps: catalogue } = usePublicCatalogue({ country, decade, source });
  const filteredFeatured = useMemo(() => catalogue.slice(0, 4), [catalogue]);
  return (
    <AppShell>
      <main>
        <section className="hero-noise overflow-hidden border-b border-[#1e302b]/10 bg-[#e9eee6]">
          <div className="container grid min-h-[620px] gap-10 py-14 lg:grid-cols-[minmax(0,.96fr)_minmax(0,1.04fr)] lg:items-center lg:py-20">
            <div className="relative z-10 max-w-xl">
              <div className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-[#d48a35]" /> Visual cataloguing for collectors</div>
              <h1 className="mt-6 font-display text-[clamp(3rem,6vw,5.8rem)] font-semibold leading-[.93] tracking-[-.065em] text-[#173a34]">The collection deserves a clearer story.</h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-[#465b51]">Browse a visual archive, identify an intriguing stamp, and keep each discovery in an album made for returning to.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-[#173a34] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(23,58,52,.18)] transition hover:bg-[#28574d] active:scale-[.97]">Explore the catalogue <ArrowRight size={16} /></Link>
                <Link href="/identify" className="inline-flex items-center gap-2 rounded-full border border-[#173a34]/15 bg-white/70 px-5 py-3.5 text-sm font-semibold text-[#173a34] transition hover:bg-white active:scale-[.97]"><Sparkles size={16} /> Identify a stamp</Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#52675d]">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4f806d]" /> {catalogue.length} available records</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4f806d]" /> 8 countries</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4f806d]" /> 7 decades</span>
              </div>
            </div>

            <div className="relative mx-auto h-[450px] w-full max-w-[540px] overflow-hidden lg:h-[510px] lg:overflow-visible">
              <div className="absolute left-[10%] top-[11%] h-[340px] w-[70%] rounded-[32px] border border-white/90 bg-[#c8d8cb] shadow-[0_30px_70px_rgba(33,68,53,.18)] lg:h-[390px]" />
              <div className="absolute left-[17%] top-[16%] grid h-[340px] w-[70%] place-items-center overflow-hidden rounded-[26px] bg-[#dce5da] lg:h-[390px]">
                <div className="absolute inset-0 opacity-[.4] [background-image:radial-gradient(#79958a_1px,transparent_1px)] [background-size:14px_14px]" />
                <StampVisual stamp={heroStamp} className="relative z-10 h-[238px] w-[188px] rotate-[-5deg] shadow-[0_22px_28px_rgba(24,58,47,.22)] lg:h-[278px] lg:w-[220px]" imageClassName="object-cover" />
              </div>
              <div className="absolute left-[2%] top-[47%] z-20 rounded-2xl border border-white/70 bg-[#fcfcf8]/95 p-3.5 shadow-[0_20px_38px_rgba(29,48,39,.14)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e3f0e3] text-[#337257]"><Layers3 size={18} /></div>
                  <div><p className="text-xs text-[#68766e]">Added to album</p><p className="text-sm font-semibold">Modern icons</p></div>
                </div>
              </div>
              <div className="absolute right-[1%] bottom-[10%] z-20 w-[200px] rounded-2xl border border-[#173a34]/10 bg-[#173a34] p-4 text-white shadow-[0_20px_38px_rgba(22,56,47,.24)]">
                <div className="flex items-center gap-2 text-[#e8c879]"><Sparkles size={15} /><span className="text-xs font-semibold uppercase tracking-[.13em]">Visual match</span></div>
                <p className="mt-3 font-display text-lg leading-tight">Flag Over Capitol</p>
                <div className="mt-3 flex items-center justify-between text-xs text-[#b9cbc0]"><span>Matching colour</span><span className="font-semibold text-[#f5d78c]">92%</span></div>
              </div>
              <StampVisual stamp={secondStamp} className="absolute right-[4%] top-[7%] h-[108px] w-[86px] rotate-[9deg] shadow-lg" showPerforation={false} />
              <StampVisual stamp={thirdStamp} className="absolute bottom-[3%] left-[27%] h-[92px] w-[73px] rotate-[8deg] shadow-lg" showPerforation={false} />
            </div>
          </div>
        </section>

        <section className="container py-20">
          <div className="grid gap-9 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div><p className="eyebrow">Start with the visual record</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-.055em] text-[#173a34]">Catalogue entries that reward a closer look.</h2></div>
            <p className="max-w-2xl text-base leading-7 text-[#52675d]">Use the public catalogue to move between countries, decades, and subjects. Published external records retain their source, attribution and reuse information alongside seeded development records.</p>
          </div>
          <div className="mt-8 grid gap-3 rounded-[1.25rem] border border-[#173a34]/10 bg-white/75 p-4 shadow-[0_10px_24px_rgba(39,65,50,.05)] md:grid-cols-3 dark:border-white/10 dark:bg-white/[.04]">
            <HomeFilter label="Country" value={country} options={countries} onChange={setCountry} />
            <HomeFilter label="Era" value={decade} options={decades} onChange={setDecade} />
            <HomeFilter label="Source" value={source} options={sources} onChange={setSource} />
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filteredFeatured.map((stamp, index) => <Link key={stamp.id} href={`/stamps/${stamp.slug}`}><FeaturedStampCard stamp={stamp} index={index} /></Link>)}
          </div>
          {!filteredFeatured.length && <p className="mt-6 text-center text-sm text-[#60746a] dark:text-[#bfd0c2]">No stamps match this combination. Try a different country, era, or source.</p>}
          <div className="mt-10 text-center"><Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-[#21493b] underline decoration-[#aac4b2] underline-offset-4 hover:decoration-[#21493b]">Browse the full catalogue <ArrowRight size={15} /></Link></div>
        </section>

        <section className="bg-[#173a34] py-20 text-white"><div className="container grid gap-12 lg:grid-cols-3"><Feature icon={<Search size={20} />} number="01" title="Find your way in" text="Search by subject, country, or year. Gentle filters make large collections feel navigable." /><Feature icon={<Sparkles size={20} />} number="02" title="Compare a discovery" text="Upload a photo to see a mock visual match, confidence score, and distinguishing features." /><Feature icon={<Layers3 size={20} />} number="03" title="Build a living album" text="Save records, note their condition, and shape a shareable gallery at your own pace." /></div></section>
      </main>
    </AppShell>
  );
}

function HomeFilter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-xs font-bold uppercase tracking-[.12em] text-[#496054] dark:text-[#c6d6ca]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#173a34]/10 bg-[#fbfbf7] px-3 text-sm font-medium normal-case tracking-normal text-[#244537] outline-none focus:border-[#5d887a] focus:ring-4 focus:ring-[#dce8df] dark:border-white/15 dark:bg-[#18332b] dark:text-white">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function Feature({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return <article className="border-t border-white/20 pt-5"><div className="flex items-center justify-between text-[#efc76f]"><span>{icon}</span><span className="text-xs font-bold tracking-[.16em]">{number}</span></div><h3 className="mt-7 font-display text-2xl font-semibold tracking-[-.035em]">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[#bcd0c4]">{text}</p></article>;
}
