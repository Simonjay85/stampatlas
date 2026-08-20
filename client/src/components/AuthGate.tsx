import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { LockKeyhole, LoaderCircle } from "lucide-react";
import { ReactNode } from "react";

export default function AuthGate({ children, title = "Your collection is waiting" }: { children: ReactNode; title?: string }) {
  const { loading, user } = useAuth();
  if (loading) return <div className="container grid min-h-[55vh] place-items-center"><LoaderCircle className="animate-spin text-[#426f5a]" /></div>;
  if (!user) return <div className="container grid min-h-[60vh] place-items-center py-10"><div className="max-w-md rounded-[1.5rem] border border-[#173a34]/10 bg-white p-8 text-center shadow-[0_16px_36px_rgba(30,53,40,.08)]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e6f0e7] text-[#3f775d]"><LockKeyhole size={20} /></span><h1 className="mt-5 font-display text-3xl font-semibold tracking-[-.04em] text-[#173a34]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#5f7268]">Sign in to manage personal stamps, build albums, and view the collection dashboard.</p><button onClick={() => startLogin()} className="mt-6 rounded-full bg-[#173a34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28574d] active:scale-[.97]">Sign in to continue</button></div></div>;
  return <>{children}</>;
}
