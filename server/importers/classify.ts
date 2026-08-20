export type ClassificationInput = { country?: string | null; issueDate?: string | null; title: string; description?: string | null; sourcePayload: string };
export type ClassificationResult = { normalizedCountry: string | null; eraDecade: string | null; classificationMethod: "source_metadata" | "heuristic" | "unclassified"; classificationConfidence: number };

const countries: Array<{ label: string; aliases: string[] }> = [
  { label: "United States", aliases: ["united states", "u.s.a.", "usa", "u.s.", "us postage"] },
  { label: "United Kingdom", aliases: ["united kingdom", "great britain", "england", "royal mail"] },
  { label: "France", aliases: ["france", "français", "francais"] },
  { label: "Japan", aliases: ["japan", "nippon", "nihon"] },
  { label: "Brazil", aliases: ["brazil", "brasil"] },
  { label: "Egypt", aliases: ["egypt", "misr", "u.a.r."] },
  { label: "Australia", aliases: ["australia", "australian"] },
  { label: "Canada", aliases: ["canada", "canadian"] },
  { label: "Germany", aliases: ["germany", "deutschland"] },
  { label: "India", aliases: ["india", "bharat"] },
];

function normalize(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); }
function countryFrom(value: string) { const haystack = normalize(value); return countries.find((country) => country.aliases.some((alias) => haystack.includes(alias)))?.label ?? null; }
function yearFrom(value: string) { const matches = value.match(/(?:18[4-9]\d|19\d{2}|20\d{2})/g) || []; const year = matches.map(Number).find((candidate) => candidate >= 1840 && candidate <= new Date().getFullYear()); return year ?? null; }

export function classifyImportedStamp(input: ClassificationInput): ClassificationResult {
  const directCountry = input.country?.trim() ? countryFrom(input.country) || input.country.trim() : null;
  const evidence = [input.title, input.description ?? "", input.sourcePayload].join(" ");
  const inferredCountry = directCountry || countryFrom(evidence);
  const year = yearFrom(input.issueDate ?? "") || yearFrom(evidence);
  const eraDecade = year ? `${Math.floor(year / 10) * 10}s` : null;
  const method = directCountry || input.issueDate ? "source_metadata" : inferredCountry || eraDecade ? "heuristic" : "unclassified";
  const confidence = method === "source_metadata" ? 96 : method === "heuristic" ? (inferredCountry && eraDecade ? 76 : 58) : 0;
  return { normalizedCountry: inferredCountry, eraDecade, classificationMethod: method, classificationConfidence: confidence };
}
