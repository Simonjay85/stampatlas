import { getStamp } from "./catalog";

const candidateSlugs = ["flag-over-capitol", "paper-crane", "coral-reef"] as const;
const confidences = [92, 78, 71] as const;

export function mockIdentificationCandidates() {
  return candidateSlugs.map((slug, index) => {
    const stamp = getStamp(slug);
    if (!stamp) throw new Error(`Seeded stamp ${slug} is missing`);
    return { stamp, confidence: confidences[index] };
  });
}
