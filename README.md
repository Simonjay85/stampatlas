# StampAtlas

StampAtlas is a polished, mobile-first philately MVP. It offers a visual public catalogue, clearly labelled mock identification, evidence-aware detail pages, authenticated collection management, albums, and public read-only profile galleries.

## Product surfaces

| Surface | Path | Access | Notes |
| --- | --- | --- | --- |
| Landing page | `/` | Public | Visual introduction and collection entry points. |
| Catalogue | `/explore` | Public | Searchable grid with country, era, topic, and condition filters. |
| Stamp record | `/stamps/:slug` | Public | Metadata, identification cues, image credit, and illustrative value evidence. |
| Identifier | `/identify` | Public | Browser-local mock image flow with deterministic match candidates. |
| Public profile | `/collections/:username` | Public | Full seeded profile collection. |
| Public album | `/collections/:username/:collectionSlug` | Public | Seeded read-only album gallery. |
| Dashboard | `/dashboard` | Authenticated | Collection records, notes, CSV export, and illustrative breakdowns. |
| Albums | `/albums` | Authenticated | Create, assign, reorder, and set cover records. |

## Data and licensing

The catalogue has **40 clearly marked mock records** spanning **8 countries** and more than **5 decades**. It does not contain proprietary catalogue numbers, marketplace results, or professional appraisals. Value evidence is labelled as a `StampAtlas development fixture` for each condition range.

The demo image assets are public-domain, public demo assets, or clearly marked development placeholders. Each stamp record exposes source-credit metadata and a source URL. Replace these assets with approved licensed or public-domain source material before a public launch.

## Persistence and authentication

The project uses Manus OAuth and tRPC protected procedures. Collection and album tables are scoped to the authenticated user ID, and server procedures enforce authenticated access. New authenticated users receive a small development collection seed to demonstrate the workspace.

The client retains a small visual fallback in isolated preview sessions where auth credentials cannot be forwarded. In normal authenticated sessions, collection and album procedures read and write the persistent database.

## Local workflow

```bash
pnpm test
pnpm test:e2e
pnpm check
pnpm build
```

Schema changes follow the Drizzle workflow: update `drizzle/schema.ts`, run `pnpm drizzle-kit generate`, inspect the generated SQL, and apply it through the managed database migration flow.

## PWA

The app includes a web manifest, icon, theme color, and lightweight navigation fallback service worker. It can be installed from compatible browsers.

## Important product boundary

StampAtlas is a collection workspace and educational catalogue shell. It must not be represented as a professional authentication service, price guide, or valuation provider. Any real catalogue reference, market observation, image, or appraisal integration needs verified licensing and an explicit provider contract.
