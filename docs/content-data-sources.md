# Content and Data Source Policy

## Scope

StampAtlas will build global SEO content from public research signals without inventing keyword volume, keyword difficulty, CPC, collector-value claims, authentication claims, or licensing facts. Search metrics stay unset until a connected SEO provider supplies verifiable data.

## Permitted stamp-data sources

| Source | Permitted intake | Publication rule |
|---|---|---|
| Wikimedia Commons | Use an official API response only; store the canonical file URL, author/attribution, licence label and licence URL. | Publish only after human review and only when the record has a compatible reuse status. Do not copy Commons descriptive prose into StampAtlas articles. |
| Smithsonian Open Access | Use official Open Access/API data only; keep the item URL and rights metadata. | Publish only records clearly designated CC0 or otherwise documented as reusable, after human review. |
| Any other provider | Require a documented API, data export, or written licence. | Stage as `needs_review` by default; do not publish assets or copied descriptions without an approved reuse status. |

## Editorial policy

1. Articles must be original editorial work based on independently structured facts, not rewritten copies of source prose.
2. Every factual source used in an article must be cited in its editorial record.
3. External stamp metadata and assets retain provenance, attribution and rights metadata throughout staging, review and publication.
4. AI may help draft a concise original summary, but cannot approve rights, authenticity, valuation or condition.

## Source references

- Wikimedia Commons explains that licence and attribution conditions are file-specific and must be independently verified before reuse: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- Wikimedia documents its official APIs at: https://www.mediawiki.org/wiki/Wikimedia_APIs
- Smithsonian states that only assets designated CC0 are released into the public domain through Open Access: https://www.si.edu/openaccess/faq
