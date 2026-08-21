import type { NormalizedStamp } from "@/data/normalizedCatalogue";
import { cn } from "@/lib/utils";

export function StampVisual({
  stamp,
  className,
  imageClassName,
  showPerforation = true,
}: {
  stamp: Pick<NormalizedStamp, "image" | "imageAlt" | "countryCode">;
  className?: string;
  imageClassName?: string;
  showPerforation?: boolean;
}) {
  return (
    <div className={cn("stamp-frame", className)}>
      <div className="stamp-paper">
        <img src={stamp.image} alt={stamp.imageAlt} className={cn("h-full w-full object-cover", imageClassName)} />
        <div className="stamp-wash" />
        <div className="stamp-mark text-[9px] font-semibold uppercase tracking-[0.18em]">{stamp.countryCode}</div>
      </div>
      {showPerforation ? <span className="stamp-perforation" aria-hidden="true" /> : null}
    </div>
  );
}
