# Requesting an Official StampWorld Data Licence or API

StampAtlas must not scrape, rehost, or redistribute StampWorld catalogue records, images, marketplace listings, or valuations without a written agreement. The appropriate next step is a commercial/licensing enquiry to StampWorld at `support@stampworld.com`.

## Prepare the request

Describe StampAtlas as a visual collection-management platform and state the intended scope precisely. Specify whether you need catalogue metadata, image URLs, downloadable image files, references, condition guidance, market data, or a combination of these. State the initial countries, historical periods, expected record count, refresh frequency, and whether public visitors can see the imported records.

## Questions to obtain in writing

| Topic | Question to ask |
| --- | --- |
| Delivery | Do you offer an API, CSV/XML/JSON export, partner feed, or another official delivery method? |
| Fields | Which fields may be imported: issuer, dates, denomination, catalogue number, descriptions, images, or prices? |
| Images | May StampAtlas cache, resize, transform, and publicly display image files? What attribution must accompany each asset? |
| Metadata | May the metadata be stored locally, indexed, and used in search and collection-management features? |
| Values | Are prices or valuations licensed separately, and what recency/disclaimer rules apply? |
| Operations | What authentication, rate limits, update cadence, quotas, monitoring, and support process apply? |
| Commercial terms | What are the territory, user-volume, pricing, audit, liability, renewal, and termination terms? |
| End of term | What data must be removed or disabled after termination, and how much notice is provided for API changes? |

## Ready-to-send email

**Subject:** Request for licensed catalogue-data/API partnership for StampAtlas

Hello StampWorld team,

We are building StampAtlas, a visual stamp catalogue and personal collection-management platform. We are interested in licensing an official, permissioned data source from StampWorld rather than scraping website pages.

For an initial pilot, we would like to evaluate access to catalogue metadata for [countries/period], with optional image and rights metadata. Our product would display the required attribution and would keep source provenance for every imported record. We would not ingest or publish any data that is outside the agreed scope.

Could you please let us know whether you offer an API, CSV/XML/JSON export, partner feed, or other licensing arrangement? We would also appreciate information on permitted fields, image caching/display rights, attribution requirements, rate limits, update frequency, pricing, and data-removal requirements on termination.

Thank you,
[Name]
[Company / StampAtlas]
[Website]

## Internal acceptance gate

Do not configure a StampWorld adapter until a signed agreement or explicit written permission identifies the permitted endpoints or feed, allowed fields, image rights, attribution rules, rate limits, storage period, and termination duties. Store the agreement reference and expiry date in the provider configuration record, and block publication when either is missing.
