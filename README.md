# 🍁 Maple CPI

**Canadian inflation, in plain sight.** A public, self-updating dashboard for the
Consumer Price Index and Bank of Canada rates — legible to someone worried about
their bills in ~3 seconds, and a real tool for someone who wants to dig.

## Why

Inflation shapes rent, groceries, and the interest on every loan — yet the actual
numbers live in dense Statistics Canada tables that most people never open. When the
headline rate makes the news, the follow-up questions go unanswered: *Is it easing or
getting worse? Which part of my life is driving it — food, shelter, gas? Is my province
different from the national figure? And what is the Bank of Canada doing about it?*

Maple CPI turns the official data into a page you can read at a glance and then
interrogate. It stays current on its own, costs nothing to run, and every view is a
link you can share.

## What you can do

- **See the headline at a glance** — the latest all-items CPI, whether the pace is
  easing or accelerating, and how it sits against the Bank of Canada's 2% target.
- **See who's driving it** — each spending group's contribution to the headline number,
  ranked, so "inflation is 3%" becomes "food and shelter are doing most of the work."
- **Explore the time series** — any group, nationally or by province, year-over-year or
  month-over-month, with an optional trend line and a compare-to-Canada overlay.
- **Follow the policy response** — the overnight rate against inflation, plus 2/5/10-year
  Government of Canada bond yields.
- **Take it with you** — every selection is encoded in the URL (**Share** button), and
  any chart exports to **CSV** or a captioned **PNG**.

## How it's built

A full rebuild of the original R/Shiny app onto a free, low-maintenance **Cloudflare**
stack: a monthly cron **Worker** pulls fresh data into **D1**, and a **SvelteKit** front
end (Observable Plot) serves it. No servers to babysit, no paid tier. The old app is
preserved under [`legacy/`](legacy/).

| Layer | Stack |
|-------|-------|
| Ingestion | Cloudflare Worker (monthly cron) — StatCan WDS + Bank of Canada Valet |
| Storage | Cloudflare D1 (SQLite) |
| Front end | SvelteKit + TypeScript, Observable Plot |
| Hosting | Cloudflare (default `*.workers.dev` / Pages) — free tier |

## Repository layout

```
packages/shared/   # schema.sql, TS types, transforms (mom/yoy/ema/contribution/custom-CPI) + tests
worker/            # ingest Worker: scheduled() cron + guarded /__ingest; sources/{statcan,boc,basket}
web/               # SvelteKit app: routes (home, timeseries, basket, rates, about) + /api/*
migrations/        # D1 migrations (0001_init.sql = schema.sql)
seed/              # resolve-vectors.ts (→ vectors.json), backfill.ts (→ out/*.sql). Run once.
legacy/            # the original R/Shiny app + Python cloud function (reference only)
docs/              # ROADMAP / BUILD_PLAN / DESIGN / WDS_VECTOR_MAP / PARKINGLOT
```

## Data model (D1)

`cpi(ref_date, geo, product_group, value)` · `boc_rates(ref_date, overnight_target,
bank_rate, corra)` · `bond_yields(ref_date, yr2, yr5, yr10)` · `basket_weights(ref_date,
geo, product_group, weight, start_month, end_month)` · `meta(key, value)`.

MoM/YoY/EMA and group contributions are **derived at read time** in
`packages/shared/transforms.ts` (pure, unit-tested) — never stored.

## Prerequisites

- Node ≥ 20, npm ≥ 10
- A Cloudflare account for deploy (free tier). `npx wrangler login` once.
- `Rscript` + the `sf` package **only** if you want to regenerate the province
  GeoJSON (already committed at `web/static/geo/provinces.geojson`).

## Local development

```bash
npm install

# 1. Create the local D1 and apply the schema
cd web
npx wrangler d1 migrations apply maple-cpi --local

# 2. Seed it with real history (see "Seeding" below to (re)generate the SQL)
for t in cpi boc_rates bond_yields basket_weights meta; do
  npx wrangler d1 execute maple-cpi --local --file ../seed/out/$t.sql
done

# 3. Run the app (a dev hook proxies the local D1 into vite dev)
npm run dev        # → http://localhost:5175
```

Run the ingest Worker locally (fetches live from StatCan/Valet):

```bash
cd worker
echo 'INGEST_TOKEN=devsecret' > .dev.vars
npx wrangler d1 migrations apply maple-cpi --local
npx wrangler dev                                   # then:
curl "http://localhost:8799/__ingest?token=devsecret"
```

## Seeding (one-off, from StatCan WDS)

History comes entirely from StatCan — no `.rds` import — so the project is
self-sufficient.

```bash
npm run seed:vectors    # resolves 99 CPI + 3 rate vectors, verifies anchors → seed/vectors.json
npm run seed:backfill   # pulls 2001→present + weights + bond yields → seed/out/*.sql
```

`seed/vectors.json` is **generated, not hand-authored** — re-run `seed:vectors` if
StatCan restructures table 18100004. The resolver verifies every series by its
WDS-returned title and asserts the confirmed Canada/BC vector anchors before writing.

## Tests & checks

```bash
npm test                                  # shared transforms (Vitest)
npm run typecheck                         # all workspaces
cd web && npm run build                   # SvelteKit + adapter-cloudflare
```

## Deploy (needs your Cloudflare account)

These steps require your login and are **not** done automatically:

```bash
# 1. Create the shared D1 database, then paste the printed database_id into
#    BOTH worker/wrangler.toml and web/wrangler.toml (binding DB).
npx wrangler d1 create maple-cpi

# 2. Apply migrations to the remote DB and load history
npx wrangler d1 migrations apply maple-cpi --remote
for t in cpi boc_rates bond_yields basket_weights meta; do
  npx wrangler d1 execute maple-cpi --remote --file seed/out/$t.sql
done

# 3. Deploy the ingest Worker (sets the monthly cron) + its secret
cd worker
npx wrangler secret put INGEST_TOKEN
npx wrangler deploy

# 4. Deploy the web app
cd ../web
npm run deploy      # vite build && wrangler pages deploy .svelte-kit/cloudflare
```

Verify the cron with `npx wrangler tail` and confirm `meta.last_ingest` advances
after a scheduled run.

## Runbook / recovery

- **Data looks stale** — check `meta.last_ingest` / `meta.last_ingest_errors`; trigger
  a manual refresh via `/__ingest?token=…`. The handler is idempotent.
- **StatCan restructured a table** — re-run `npm run seed:vectors` (it will abort loudly
  if the anchors no longer reproduce), then `npm run seed:backfill` and reload.
- **Rebuild from scratch** — `wrangler d1 create`, apply migrations, run the two seed
  scripts, load `seed/out/*.sql`, deploy.

## Scope (v1)

Canada + 10 provinces, English, 2001→present, default `*.workers.dev` host. Territories,
cities, and French are deferred — see [`docs/PARKINGLOT.md`](docs/PARKINGLOT.md).

Data © Statistics Canada (Tables 18-10-0004, 18-10-0007, 10-10-0139) and the Bank of
Canada (Valet). Not investment advice.
