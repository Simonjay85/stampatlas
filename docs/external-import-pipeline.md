# External Stamp Import Pipeline

The example pipeline treats external content as **staged evidence**, not as immediately publishable catalogue data. It never crawls StampWorld. Instead, it calls documented source APIs, writes a normalized candidate payload, and lets an administrator stage and review each record before it is eligible for publication.

## Data flow

| Stage | Responsibility | Persisted fields |
| --- | --- | --- |
| Acquire | Call the provider’s documented API with a narrow topical query and bounded page size. | Original response in `sourcePayload`; provider name; source ID; canonical URL; retrieval timestamp. |
| Normalize | Produce a provider-neutral record and optional image asset entries. | Title, issuer/country when available, issue date, denomination, description, canonical URL, attribution, and rights fields. |
| Stage | Send the normalized records to the admin-only `externalImports.stage` procedure. | Import-job counts, pending records, and source assets. |
| Review | An administrator checks identity, rights evidence, attribution, and duplicate risk. | `reviewStatus`, `reviewNote`, reviewer ID, and review timestamp. |
| Publish | An administrator calls `externalImports.publish` for a rights-cleared, approved record. The public `externalCatalogue.list` endpoint returns only published records. | A stable public slug, publisher, timestamps, linked provenance record, and linked source assets. |

## Wikimedia Commons example

Wikimedia Commons exposes a documented MediaWiki API. The importer calls that API rather than downloading HTML pages and marks all output `needs_review` unless the returned licence metadata indicates public domain or CC BY.

```bash
pnpm import:wikimedia -- --query "postage stamp Japan" --limit 10 --out /tmp/wikimedia-stamps.json
```

Review the JSON first. Then pass the `provider`, `query`, and `records` fields to the admin-only `externalImports.stage` tRPC procedure. Do not bypass the review step just because a result includes a rights label: the file page and individual asset provenance still need human confirmation.

## Smithsonian example

Smithsonian’s Open Access metadata API requires a key from its developer portal. The script intentionally refuses to run without `SMITHSONIAN_API_KEY`; this prevents accidental unauthenticated or copied-data workflows.

```bash
export SMITHSONIAN_API_KEY="your-key-from-the-smithsonian"
pnpm import:smithsonian -- --query "postage stamp" --limit 10 --out /tmp/smithsonian-stamps.json
```

Only records with a clear asset-level right can have media displayed. Smithsonian’s developer guidance notes that some records provide CC0 metadata but omit media where object rights prevent image delivery; preserve that distinction as `metadata_only` or `needs_review` in StampAtlas.

## Administration boundary

The tRPC endpoints `externalImports.list`, `externalImports.stage`, `externalImports.review`, and `externalImports.publish` use the existing administrator guard. Standard users cannot read, stage, approve, reject, or publish external-import records. Publishing is additionally blocked unless the record is approved and its reuse status is `public_domain`, `cc_by`, or `permission_granted`. This keeps raw provider payloads and rights decisions separate from public catalogue browsing.

## Production considerations

Use small bounded manual imports during the pilot. When a provider grants a licensed bulk feed or API, define per-provider rate limits, a contact email/User-Agent, error backoff, field mapping, deletion handling, and an import policy that captures the licence agreement reference and expiry date. Do not schedule recurring imports until these commercial and operational terms are known.
