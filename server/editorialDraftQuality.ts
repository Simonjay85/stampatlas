export type DraftQualityInput = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  seoTitle: string;
  seoDescription: string;
  relatedLink: string;
};

const unsupportedClaim = /\b(guaranteed authentic|certified authentic|this stamp is authentic|we authenticate|market value (?:is|of)\s*[$£€]|worth\s*[$£€]|[$£€]\s*\d+(?:[,.]\d+)?)\b/i;

export function addEditorialInternalLink(bodyMarkdown: string, relatedLink: string) {
  const cleanBody = bodyMarkdown.trim();
  if (cleanBody.includes(`](${relatedLink})`)) return cleanBody;
  return `${cleanBody}\n\n## Continue your research\n\nUse StampAtlas to keep your observations organised as you learn: [open the related guide or workspace](${relatedLink}).`;
}

export function validateDraftQuality(input: DraftQualityInput) {
  const errors: string[] = [];
  if (input.bodyMarkdown.length < 900 || input.bodyMarkdown.length > 12_000) errors.push("Body must be 900–12,000 characters");
  if (input.summary.length < 40 || input.summary.length > 500) errors.push("Summary must be 40–500 characters");
  if (input.seoTitle.length < 12 || input.seoTitle.length > 180) errors.push("SEO title must be 12–180 characters");
  if (input.seoDescription.length < 70 || input.seoDescription.length > 320) errors.push("SEO description must be 70–320 characters");
  if (!input.bodyMarkdown.includes(`](${input.relatedLink})`)) errors.push("Required internal link is missing");
  if (unsupportedClaim.test(input.bodyMarkdown)) errors.push("Unsupported authentication or valuation claim");
  return errors;
}

function words(value: string) {
  return value.toLowerCase().replace(/\[[^\]]+\]\([^\)]+\)/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

export function findSharedPhrases(articles: Array<{ slug: string; bodyMarkdown: string }>, phraseLength = 12) {
  const phraseOwners = new Map<string, Set<string>>();
  for (const article of articles) {
    const content = article.bodyMarkdown.split("## Continue your research")[0] ?? article.bodyMarkdown;
    const uniquePhrases = new Set<string>();
    const tokens = words(content);
    for (let index = 0; index <= tokens.length - phraseLength; index += 1) uniquePhrases.add(tokens.slice(index, index + phraseLength).join(" "));
    for (const phrase of Array.from(uniquePhrases)) {
      const owners = phraseOwners.get(phrase) ?? new Set<string>();
      owners.add(article.slug);
      phraseOwners.set(phrase, owners);
    }
  }
  return Array.from(phraseOwners.entries()).filter(([, owners]) => owners.size > 1).map(([phrase, owners]) => ({ phrase, slugs: Array.from(owners).sort() }));
}
