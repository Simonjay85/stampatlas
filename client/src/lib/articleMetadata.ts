export type ArticleMetadata = {
  title: string;
  description: string;
  canonicalUrl?: string | null;
  slug: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

const jsonLdId = "stampatlas-article-jsonld";
const canonicalId = "stampatlas-article-canonical";

function absoluteCanonical(canonicalUrl: string | null | undefined, slug: string) {
  const fallback = new URL(`/blog/${encodeURIComponent(slug)}`, window.location.origin).toString();
  if (!canonicalUrl) return fallback;
  try {
    const candidate = new URL(canonicalUrl, window.location.origin);
    return candidate.protocol === "https:" || candidate.protocol === "http:" ? candidate.toString() : fallback;
  } catch {
    return fallback;
  }
}

function upsertMeta(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function applyArticleMetadata(input: ArticleMetadata) {
  const title = `${input.title} | StampAtlas`;
  const canonical = absoluteCanonical(input.canonicalUrl, input.slug);
  document.title = title;
  upsertMeta("description", input.description);

  let link = document.getElementById(canonicalId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = canonicalId;
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonical;

  let script = document.getElementById(jsonLdId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = jsonLdId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: "StampAtlas" },
    publisher: { "@type": "Organization", name: "StampAtlas" },
    ...(input.publishedAt ? { datePublished: new Date(input.publishedAt).toISOString() } : {}),
    ...(input.updatedAt ? { dateModified: new Date(input.updatedAt).toISOString() } : {}),
  });
}

export function isSafeMarkdownLink(url: string) {
  return /^\/[a-zA-Z0-9_/?#=&.-]*$/.test(url) || /^https:\/\/[a-z0-9.-]+(?:\:[0-9]+)?(?:\/[^\s]*)?$/i.test(url);
}
