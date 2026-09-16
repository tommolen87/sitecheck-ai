# SiteCheck AI

Een Nederlandse website-check die ondernemers helpt om hun website te laten scannen en later praktische verbeteradviezen te ontvangen.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/sitecheck-ai run dev` — run the SiteCheck AI web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/sitecheck-ai/src/App.tsx` — Dutch landing page and scan submission flow
- `artifacts/sitecheck-ai/src/index.css` — SiteCheck AI visual theme and responsive layout
- `artifacts/api-server/src/routes/scans.ts` — scan request API routes
- `lib/api-spec/openapi.yaml` — source of truth for scan API contracts
- `lib/db/src/schema/scans.ts` — persisted scan request model

## Architecture decisions

- Scan requests are persisted immediately, but the first version returns only `queued`; no scores or analysis findings are fabricated.
- The frontend uses generated API hooks from the shared OpenAPI contract, so future crawling and analysis workers can extend the same scan lifecycle.
- The landing page validates website URLs in the browser and again on the server; the server only accepts HTTP and HTTPS URLs.

## Product

- Visitors can submit a website URL without an account and receive an honest queued confirmation.
- The API supports creating, listing, and retrieving scan requests, ready for future crawling, scoring, and report modules.

## User preferences

The user asked for a clean, professional Dutch-language experience aimed at Dutch small and medium-sized businesses.

## Gotchas

- Keep `info.title: Api` unchanged in the OpenAPI file so generated imports keep their stable filenames.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
