import AppShell from "@/components/AppShell";
import { StampVisual } from "@/components/StampVisual";
import { featuredStamps, stamps } from "@/data/catalog";
import { ArrowRight, CheckCircle2, Layers3, Search, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [heroStamp, secondStamp, thirdStamp] = featuredStamps;
  return (
    <AppShell>
      <main>
        <section className="hero-noise overflow-hidden border-b border-[#1e302b]/10 bg-[#e9eee6]">
          <div className="container grid min-h-[620px] gap-12 py-14 lg:grid-cols-[.94fr_1.06fr] lg:items-center lg:py-20">
            <div className="relative z-10 max-w-xl">
              <div className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-[#d48a35]" /> Visual cataloguing for collectors</div>
              <h1 className="mt-6 font-display text-[clamp(3rem,6vw,5.8rem)] font-semibold leading-[.93] tracking-[-.065em] text-[#173a34]">The collection deserves a clearer story.</h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-[#465b51]">Browse a visual archive, identify an intriguing stamp, and keep each discovery in an album made for returning to.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-[#173a34] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(23,58,52,.18)] transition hover:bg-[#28574d] active:scale-[.97]">Explore the catalogue <ArrowRight size={16} /></Link>
                <Link href="/identify" className="inline-flex items-center gap-2 rounded-full border border-[#173a34]/15 bg-white/70 px-5 py-3.5 text-sm font-semibold text-[#173a34] transition hover:bg-white active:scale-[.97]"><Sparkles size={16} /> Identify a stamp</Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#52675d]">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4f806d]" /> 40 seed records</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4f806d]" /> 8 countries</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4f806d]" /> 7 decades</span>
              </div>
            </div>

            <div className="relative mx-auto h-[480px] w-full max-w-[640px] lg:h-[560px]">
              <div className="absolute left-[8%] top-[9%] h-[370px] w-[72%] rounded-[32px] border border-white/90 bg-[#c8d8cb] shadow-[0_30px_70px_rgba(33,68,53,.18)] lg:h-[425px]" />
              <div className="absolute left-[15%] top-[14%] grid h-[370px] w-[72%] place-items-center overflow-hidden rounded-[26px] bg-[#dce5da] lg:h-[425px]">
                <div className="absolute inset-0 opacity-[.4] [background-image:radial-gradient(#79958a_1px,transparent_1px)] [background-size:14px_14px]" />
                <StampVisual stamp={heroStamp} className="relative z-10 h-[265px] w-[210px] rotate-[-5deg] shadow-[0_22px_28px_rgba(24,58,47,.22)] lg:h-[318px] lg:w-[252px]" imageClassName="object-cover" />
              </div>
              <div className="absolute -left-1 top-[46%] rounded-2xl border border-white/70 bg-[#fcfcf8]/95 p-4 shadow-[0_20px_38px_rgba(29,48,39,.14)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e3f0e3] text-[#337257]"><Layers3 size={18} /></div>
                  <div><p className="text-xs text-[#68766e]">Added to album</p><p className="text-sm font-semibold">Modern icons</p></div>
                </div>
              </div>
              <div className="absolute -right-2 bottom-[9%] w-[220px] rounded-2xl border border-[#173a34]/10 bg-[#173a34] p-4 text-white shadow-[0_20px_38px_rgba(22,56,47,.24)]">
                <div className="flex items-center gap-2 text-[#e8c879]"><Sparkles size={15} /><span className="text-xs font-semibold uppercase tracking-[.13em]">Visual match</span></div>
                <p className="mt-3 font-display text-lg leading-tight">Flag Over Capitol</p>
                <div className="mt-3 flex items-center justify-between text-xs text-[#b9cbc0]"><span>Matching colour</span><span className="font-semibold text-[#f5d78c]">92%</span></div>
              </div>
              <StampVisual stamp={secondStamp} className="absolute right-[2%] top-[5%] h-[122px] w-[97px] rotate-[9deg] shadow-lg" showPerforation={false} />
              <StampVisual stamp={thirdStamp} className="absolute bottom-[1%] left-[25%] h-[104px] w-[83px] rotate-[8deg] shadow-lg" showPerforation={false} />
            </div>
          </div>
        </section>

        <section className="container py-20">
          <div className="grid gap-9 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div><p className="eyebrow">Start with the visual record</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-.055em] text-[#173a34]">Catalogue entries that reward a closer look.</h2></div>
            <p className="max-w-2xl text-base leading-7 text-[#52675d]">Use the public catalogue to move between countries, decades, and subjects. Every demo record has an image credit, identifying characteristics, and a carefully labelled evidence panel.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featuredStamps.map((stamp, index) => <Link key={stamp.id} href={`/stamps/${stamp.slug}`} className="catalogue-card group"><div className="relative grid aspect-[.98] place-items-center overflow-hidden bg-[#e6ebe2] p-7"><StampVisual stamp={stamp} className="h-[210px] w-[165px] transition duration-300 group-hover:-translate-y-2 group-hover:rotate-[-2deg] group-hover:shadow-xl" /><span className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.13em] text-[#3d584c]">0{index + 1}</span></div><div className="p-5"><div className="flex justify-between gap-3 text-xs font-semibold uppercase tracking-[.11em] text-[#718178]"><span>{stamp.country}</span><span>{stamp.year}</span></div><h3 className="mt-2 font-display text-xl font-semibold tracking-[-.03em]">{stamp.title}</h3><p className="mt-3 text-sm text-[#63756a]">Mint estimate <span className="font-semibold text-[#274b3d]">${stamp.value.mint[0]}–${stamp.value.mint[1]}</span></p></div></Link>)}
          </div>
          <div className="mt-10 text-center"><Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-[#21493b] underline decoration-[#aac4b2] underline-offset-4 hover:decoration-[#21493b]">Browse all {stamps.length} demo records <ArrowRight size={15} /></Link></div>
        </section>

        <section className="bg-[#173a34] py-20 text-white"><div className="container grid gap-12 lg:grid-cols-3"><Feature icon={<Search size={20} />} number="01" title="Find your way in" text="Search by subject, country, or year. Gentle filters make large collections feel navigable." /><Feature icon={<Sparkles size={20} />} number="02" title="Compare a discovery" text="Upload a photo to see a mock visual match, confidence score, and distinguishing features." /><Feature icon={<Layers3 size={20} />} number="03" title="Build a living album" text="Save records, note their condition, and shape a shareable gallery at your own pace." /></div></section>
      </main>
    </AppShell>
  );
}

function Feature({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return <article className="border-t border-white/20 pt-5"><div className="flex items-center justify-between text-[#efc76f]"><span>{icon}</span><span className="text-xs font-bold tracking-[.16em]">{number}</span></div><h3 className="mt-7 font-display text-2xl font-semibold tracking-[-.035em]">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[#bcd0c4]">{text}</p></article>;
}
