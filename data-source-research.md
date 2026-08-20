# External Stamp Data Source Research

## StampWorld initial review

- Public catalogue landing page: https://www.stampworld.com/en/
- The homepage advertises a catalogue of 750,000+ stamps and 700,000+ colour images, plus marketplace and collector-profile features.
- The public footer exposes links to a Privacy Policy and Terms and Conditions. These terms must be reviewed before any automated collection, copying, or reuse of catalogue records and images.
- No public API, bulk-data feed, or explicit reusable-data licence was evident on the reviewed homepage.

**Current posture:** do not crawl or import StampWorld catalogue records, images, valuations, or listing content into StampAtlas until StampWorld grants written permission or provides an official licensed export/API.

## Viable alternatives

| Source | Verified capability | Appropriate use in StampAtlas |
| --- | --- | --- |
| Smithsonian Open Access | Offers reusable digital collection content and developer tooling, including a Smithsonian API and data repository. | Import only records whose asset-level rights status permits reuse; retain accession, source URL, rights note, and image attribution. |
| Library of Congress | Publishes a structured JSON/YAML API and IIIF image services specifically intended to provide machine-readable access instead of scraping. | Ingest metadata through the documented API; use only images whose individual rights statements allow the intended use. |
| Wikimedia Commons | Provides documented MediaWiki and structured-data APIs. | Obtain files and attribution through the API while filtering for public-domain or compatible licenses. |

These sources are preferable because they expose documented interfaces. Asset-level rights checks remain mandatory even when the source provides an API.

## Recommendation

> **Do not build a crawler that imports or rehosts StampWorld records, images, market listings, or valuations without a written licence or an official export/API agreement.**

StampWorld’s public landing page promotes a large catalogue and colour-image collection, but it does not advertise a public API or a reusable-data licence.[1] Its published conditions say that text offered by the website belongs to its author, prohibit collecting personal information displayed on the site, and prohibit copying images found on StampWorld for new sales.[2] Its robots file permits ordinary search indexing but explicitly reserves rights around AI use and blocks several automated agents; robots directives are not a grant to reproduce or redistribute catalogue content.[3]

The safer first release is a **licensed-source pipeline**. Smithsonian Open Access is suitable for assets explicitly marked reusable, because it provides developer tools and an API for its open-access collection.[4] The Library of Congress exposes structured JSON/YAML and IIIF image services specifically to support machine-readable access instead of scraping pages.[5] Wikimedia Commons can contribute files only after filtering at the individual-file level for public-domain or compatible licence status.[6]

| Decision | StampWorld | Smithsonian / Library of Congress / Wikimedia Commons |
| --- | --- | --- |
| Automated import today | **No**; no public API or reuse licence was found in the reviewed material. | **Yes, conditionally**; use documented APIs and asset-level rights rules. |
| Store source metadata | Only with written permission or a licensed feed. | Store source ID, canonical URL, rights label, retrieval date, and attribution. |
| Cache/rehost images | Do not assume permission. | Only when the individual asset licence expressly permits it. |
| Import valuations or sale prices | Do not import; these can be proprietary, volatile, or seller-generated. | Keep value evidence separate from catalogue metadata and use licensed market-data providers where needed. |

## Proposed integration architecture

Build provider adapters instead of a universal crawler. Each adapter should use the provider’s documented API or licensed export, emit a provider-specific record, and send it to a staging table. A normalization service then maps country, issue date, denomination, topic, catalogue reference, physical characteristics, and source identifiers into the StampAtlas catalogue model. Every asset must carry a source URL, creator, licence text, rights-review date, and a `reuseStatus` such as `public_domain`, `cc_by`, `permission_granted`, `metadata_only`, or `blocked`.

An approval gate should prevent publication until the record meets both data-quality and rights checks. At minimum, require a stable source identifier, a verified rights status, provenance fields, a deduplication key, and a reviewer decision. Use a separate image table so a future licence withdrawal can disable the image while retaining a lawful metadata-only record. Keep source values or marketplace listings out of the main catalogue unless there is a separate commercial-data agreement.

## Practical next step for StampWorld

Contact `support@stampworld.com` with a short commercial partnership request rather than crawling. Ask whether they offer an API, CSV/XML export, affiliate feed, or attribution-based licence for catalogue metadata and images; request explicit answers on rehosting, caching, update frequency, permitted fields, rate limits, valuation use, price, and termination/deletion obligations. If permission is granted, encode those terms as a provider policy before importing a single record.

## References

[1]: https://www.stampworld.com/en/ "StampWorld catalogue homepage"
[2]: https://www.stampworld.com/en/disclaimer/ "StampWorld Terms and Conditions"
[3]: https://www.stampworld.com/robots.txt "StampWorld robots.txt"
[4]: https://www.si.edu/openaccess "Smithsonian Open Access"
[5]: https://www.loc.gov/apis/ "Library of Congress APIs"
[6]: https://commons.wikimedia.org/wiki/Commons:API "Wikimedia Commons API"
