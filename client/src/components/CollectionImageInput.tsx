import { trpc } from "@/lib/trpc";
import { ImagePlus, X } from "lucide-react";
import { useState } from "react";

export function CollectionImageInput({ itemId, side, url }: { itemId: string; side: "front" | "back"; url: string | null }) {
  const utils = trpc.useUtils();
  const [error, setError] = useState("");
  const upload = trpc.collection.uploadItemImage.useMutation({ onSuccess: () => void utils.collection.list.invalidate() });
  const remove = trpc.collection.removeItemImage.useMutation({ onSuccess: () => void utils.collection.list.invalidate() });
  function select(file: File | undefined) { if (!file) return; if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 6 * 1024 * 1024) { setError("JPEG, PNG or WebP up to 6MB only"); return; } const reader = new FileReader(); reader.onload = () => upload.mutate({ itemId: Number(itemId), side, dataUrl: String(reader.result), mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", filename: file.name }); reader.readAsDataURL(file); }
  return <span className="inline-flex items-center gap-1"><label className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#456b59] hover:underline"><ImagePlus size={13} /> {upload.isPending ? "Uploading…" : side === "front" ? "Front" : "Back"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => select(event.target.files?.[0])} />{url ? <img src={url} alt={`${side} reference`} className="h-5 w-5 rounded object-cover" /> : null}{error ? <span className="sr-only" role="alert">{error}</span> : null}</label>{url ? <button type="button" onClick={() => remove.mutate({ itemId: Number(itemId), side })} disabled={remove.isPending} className="grid h-5 w-5 place-items-center rounded text-[#7d5741] hover:bg-[#f7e7df] disabled:opacity-50" aria-label={`Remove ${side} image`} title="Remove image"><X size={12} /></button> : null}</span>;
}
