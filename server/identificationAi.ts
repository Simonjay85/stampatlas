import { invokeLLM, listLLMModels } from "./_core/llm";
import { stamps } from "../client/src/data/catalog";

export type StampAiRecognition = {
  likelySlug: string | null;
  alternativeSlugs: string[];
  confidence: number;
  summary: string;
  visualClues: string[];
  needsResearch: boolean;
  model: string;
};

const candidateContext = stamps.map((stamp) => ({ slug: stamp.slug, title: stamp.title, country: stamp.country, year: stamp.year, denomination: stamp.denomination })).slice(0, 120);
const allowedSlugs = new Set(candidateContext.map((candidate) => candidate.slug));

export async function analyzeStampImage(dataUrl: string): Promise<StampAiRecognition> {
  const models = await listLLMModels();
  const model = models.data.find((item) => item.id === "gemini-3-flash-preview")?.id ?? models.data.find((item) => item.id === "gpt-5-mini")?.id;
  if (!model) throw new Error("No supported AI model is currently available");
  const response = await invokeLLM({
    model,
    max_tokens: 900,
    messages: [
      { role: "system", content: "You are a cautious philately visual assistant. Inspect only visible features in the submitted stamp image. Do not claim authenticity, rarity, value, condition grade, catalogue certainty, or provenance. Use null and needsResearch=true whenever unsure. Pick catalogue slugs only from the supplied candidate list. Return concise plain-language observations." },
      { role: "user", content: [{ type: "text", text: `Compare this image against these public catalogue candidates: ${JSON.stringify(candidateContext)}. The image is processed transiently for this response and must not be described as stored.` }, { type: "image_url", image_url: { url: dataUrl, detail: "high" } }] },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "stamp_visual_recognition",
        strict: true,
        schema: {
          type: "object",
          properties: {
            likelySlug: { type: ["string", "null"] },
            alternativeSlugs: { type: "array", items: { type: "string" }, maxItems: 4 },
            confidence: { type: "integer", minimum: 0, maximum: 100 },
            summary: { type: "string", maxLength: 500 },
            visualClues: { type: "array", items: { type: "string" }, maxItems: 5 },
            needsResearch: { type: "boolean" },
          },
          required: ["likelySlug", "alternativeSlugs", "confidence", "summary", "visualClues", "needsResearch"],
          additionalProperties: false,
        },
      },
    },
  });
  const raw = response.choices[0]?.message.content;
  const content = typeof raw === "string" ? raw : "";
  const parsed = JSON.parse(content) as Omit<StampAiRecognition, "model">;
  const likelySlug = parsed.likelySlug && allowedSlugs.has(parsed.likelySlug) ? parsed.likelySlug : null;
  const alternativeSlugs = Array.from(new Set(parsed.alternativeSlugs.filter((slug) => allowedSlugs.has(slug) && slug !== likelySlug))).slice(0, 4);
  return { likelySlug, alternativeSlugs, confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0))), summary: String(parsed.summary).slice(0, 500), visualClues: parsed.visualClues.map(String).slice(0, 5), needsResearch: true, model };
}
