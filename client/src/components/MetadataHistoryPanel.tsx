import { Clock3, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

function value(value: string | null) {
  return value?.trim() || "Unclassified";
}

export function MetadataHistoryPanel({ recordId }: { recordId: number }) {
  const [open, setOpen] = useState(false);
  const history = trpc.externalImports.history.useQuery({ id: recordId }, { enabled: open });

  return <div className="mt-4 border-t border-[#173a34]/10 pt-3 dark:border-white/10">
    <button onClick={() => setOpen((current) => !current)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#317154] underline underline-offset-4"><Clock3 size={13} /> {open ? "Hide metadata history" : "View metadata history"}</button>
    {open && <div className="mt-3 grid gap-2 rounded-xl bg-[#f4f7f3] p-3 text-xs dark:bg-black/15">
      {history.isLoading ? <div className="flex items-center gap-2 text-[#60746a]"><LoaderCircle size={14} className="animate-spin" /> Loading history…</div> : history.data?.length ? history.data.map((entry) => <div key={entry.id} className="rounded-lg border border-[#173a34]/10 bg-white p-2.5 dark:border-white/10 dark:bg-white/5"><p className="font-bold text-[#244c3e] dark:text-[#dff0e3]">{entry.changedBy?.name || entry.changedBy?.email || "Former team member"}</p><p className="mt-1 leading-5 text-[#60746a] dark:text-[#bdd0c2]">Country: <b>{value(entry.previousCountry)}</b> → <b>{value(entry.nextCountry)}</b><br />Era: <b>{value(entry.previousEraDecade)}</b> → <b>{value(entry.nextEraDecade)}</b></p><p className="mt-1 text-[#809087] dark:text-[#9caf9f]">{new Date(entry.changedAt).toLocaleString()}</p></div>) : <p className="text-[#60746a] dark:text-[#bdd0c2]">No manual metadata changes have been recorded for this stamp.</p>}
    </div>}
  </div>;
}
