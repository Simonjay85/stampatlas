import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Moon, Search, Sparkles, Stamp as StampIcon, Sun } from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const canReviewImports = user?.role === "reviewer" || user?.role === "admin";
  const pendingImports = trpc.externalImports.pendingSummary.useQuery(undefined, { enabled: !!canReviewImports });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocation(`/explore?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="app-shell min-h-screen bg-[#f7f5f0] text-[#14221f]">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-[#1e302b]/10 bg-[#f7f5f0]/90 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center gap-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#173a34] text-[#f5c76a] shadow-[0_5px_16px_rgba(23,58,52,.18)] transition-transform group-hover:-rotate-6">
              <StampIcon size={18} strokeWidth={2.4} />
            </span>
            <span className="font-display text-xl font-semibold tracking-[-0.04em]">StampAtlas</span>
          </Link>

          <form onSubmit={submitSearch} className="hidden max-w-[360px] flex-1 md:block">
            <label className="relative block">
              <span className="sr-only">Search the catalogue</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b766f]" size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-full border border-[#1e302b]/10 bg-white/75 pl-10 pr-4 text-sm outline-none transition focus:border-[#5d887a] focus:ring-4 focus:ring-[#dce8df]"
                placeholder="Search stamps, countries, years..."
              />
            </label>
          </form>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            <NavLink href="/explore">Browse</NavLink>
            <NavLink href="/blog">Journal</NavLink>
            <NavLink href="/identify" icon><Sparkles size={14} /> Identify</NavLink>
            {user && <NavLink href="/identify/history">My scans</NavLink>}
            <NavLink href="/dashboard">My Collection</NavLink>
            <NavLink href="/albums">Albums</NavLink>
            {user && <NavLink href="/profile">Profile</NavLink>}
            {canReviewImports && <NavLink href="/admin/imports">Review imports{pendingImports.data?.count ? <span className="ml-1 rounded-full bg-[#e6b95d] px-1.5 py-0.5 text-[10px] text-[#173a34]">{pendingImports.data.count}</span> : null}</NavLink>}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-full border border-[#173a34]/10 bg-white/75 text-[#315746] transition hover:bg-[#e7f0e7] active:scale-[.97]" aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {loading ? <span className="h-9 w-20 animate-pulse rounded-full bg-[#e5e8df]" /> : user ? (
              <button onClick={logout} className="flex h-10 items-center gap-2 rounded-full bg-[#173a34] py-1 pl-1 pr-3 text-sm font-medium text-white transition hover:bg-[#28574d] active:scale-[.97]" title="Sign out">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e7b95d] text-xs font-bold text-[#173a34]">{user.name?.slice(0, 2).toUpperCase() || "SA"}</span>
                <span className="hidden sm:inline">{user.name?.split(" ")[0] || "Collector"}</span>
              </button>
            ) : (
              <button onClick={() => startLogin()} className="rounded-full bg-[#173a34] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#28574d] active:scale-[.97]">
                Sign in
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-5 overflow-x-auto px-5 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a5e55] lg:hidden">
          <Link href="/explore">Browse</Link><Link href="/blog">Journal</Link><Link href="/identify">Identify</Link>{user && <Link href="/identify/history">My scans</Link>}<Link href="/dashboard">My Collection</Link><Link href="/albums">Albums</Link>{user && <Link href="/profile">Profile</Link>}{canReviewImports && <Link href="/admin/imports">Review imports{pendingImports.data?.count ? ` (${pendingImports.data.count})` : ""}</Link>}
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>{children}</div>
      <footer className="border-t border-[#1e302b]/10 bg-[#143830] py-10 text-[#dce8df]">
        <div className="container grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-white">A more thoughtful way to collect.</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#b8c9bf]">StampAtlas uses clearly marked development data and illustrative value ranges. It is not a professional appraisal or a proprietary catalogue.</p>
          </div>
          <p className="text-sm text-[#b8c9bf]">© {new Date().getFullYear()} StampAtlas · Collection tools for curious philatelists</p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode; icon?: boolean }) {
  return <Link href={href} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[#32463e] transition hover:bg-[#e6eee7] hover:text-[#173a34]">{children}</Link>;
}
