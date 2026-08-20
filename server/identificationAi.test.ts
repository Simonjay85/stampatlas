import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn(), listLLMModels: vi.fn() }));

import { invokeLLM, listLLMModels } from "./_core/llm";
import { analyzeStampImage } from "./identificationAi";
import { stamps } from "../client/src/data/catalog";

describe("AI stamp recognition", () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it("keeps only known catalogue slugs and always flags research as needed", async () => {
    const known = stamps[0].slug;
    vi.mocked(listLLMModels).mockResolvedValue({ object: "list", data: [{ id: "gemini-3-flash-preview", object: "model", created: 0, owned_by: "test" }] });
    vi.mocked(invokeLLM).mockResolvedValue({ id: "test", created: 0, model: "gemini-3-flash-preview", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify({ likelySlug: known, alternativeSlugs: ["not-in-catalogue", known], confidence: 81, summary: "Visible frame and colour cues resemble the record.", visualClues: ["A visible printed denomination"], needsResearch: false }) } }] });
    const result = await analyzeStampImage("data:image/png;base64,AA==");
    expect(result).toMatchObject({ likelySlug: known, alternativeSlugs: [], confidence: 81, needsResearch: true, model: "gemini-3-flash-preview" });
  });
});
