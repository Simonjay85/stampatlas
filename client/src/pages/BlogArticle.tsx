import AppShell from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ExternalLink, LoaderCircle } from "lucide-react";
import React, { useEffect } from "react";
import { Link, useRoute } from "wouter";

function useArticleMetadata(title?: string, description?: string) {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} | StampAtlas`;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) { tag = document.createElement("meta"); tag.setAttribute("name", "description"); document.head.appendChild(tag); }
    if (description) tag.setAttribute("content", description);
  }, [description, title]);
}

function MarkdownBody({ value }: { value: string }) {
  return <div className="space-y-5 text-base leading-8 text-[#31463d]">{value.split(/\n{2,}/).filter(Boolean).map((block, index) => {
    const text = block.trim();
    if (text.startsWith("## ")) return <h2 key={index} className="pt-4 font-display text-3xl font-semibold tracking-[-.04em] text-[#173a34]">{text.slice(3)}</h2>;
    if (text.startsWith("# ")) return <h2 key={index} className="pt-4 font-display text-4xl font-semibold tracking-[-.05em] text-[#173a34]">{text.slice(2)}</h2>;
    if (text.split("\n").every((line) => line.startsWith("- "))) return <ul key={index} className="list-disc space-y-2 pl-6">{text.split("\n").map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
    return <p key={index}>{text}</p>;
  })}</div>;
}

export default function BlogArticle() {
  const [, params] = useRoute("/blog/:slug");
  const article = trpc.blog.bySlug.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug) });
  useArticleMetadata(article.data?.seoTitle, article.data?.seoDescription);
  if (article.isLoading) return <AppShell><main className="container grid min-h-[58vh] place-items-center py-16"><LoaderCircle className="animate-spin text-[#315746]" aria-label="Loading article" /></main></AppShell>;
  if (!article.data) return <AppShell><main className="container py-20"><p className="eyebrow">Article unavailable</p><h1 className="mt-4 font-display text-5xl font-semibold">This article is not published.</h1><Link href="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#315746]"><ArrowLeft size={16} /> Back to the journal</Link></main></AppShell>;
  const entry = article.data;
  return <AppShell><main><article className="container max-w-4xl py-12 sm:py-20"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#315746] hover:underline"><ArrowLeft size={16} /> StampAtlas journal</Link><p className="eyebrow mt-9">{entry.cluster}</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-.06em] text-[#173a34] sm:text-6xl">{entry.title}</h1><p className="mt-6 max-w-3xl text-xl leading-8 text-[#587066]">{entry.summary}</p><div className="mt-12 border-y border-[#173a34]/10 py-10"><MarkdownBody value={entry.bodyMarkdown} /></div><aside className="mt-10 rounded-3xl bg-[#e9eee6] p-6"><h2 className="font-display text-2xl font-semibold text-[#173a34]">Sources used for research</h2><p className="mt-2 text-sm leading-6 text-[#63756a]">Links are provided for verification. StampAtlas has written this article independently and does not treat a source as an authentication or valuation guarantee.</p><ul className="mt-4 space-y-2">{entry.sourceReferences.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#315746] hover:underline">{source.label}<ExternalLink size={14} /></a></li>)}</ul></aside></article></main></AppShell>;
}
