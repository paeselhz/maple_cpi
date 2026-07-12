# BUILD PLAN — Maple CPI (Cloudflare + SvelteKit rebuild)

> A step-by-step plan for a **Claude Code** session to rebuild [`paeselhz/maple_cpi`](https://github.com/paeselhz/maple_cpi/tree/main) as a modern, low-maintenance stack: a **Cloudflare Worker** cron that pulls Canadian CPI + Bank of Canada rate data into **D1**, consumed by a **SvelteKit + TypeScript** front end.

### Locked decisions (v1)
- **Charts:** Observable Plot (d3-native, Svelte-friendly, no commercial license). *Note:* Plot is declarative-static — interactive tooltips use `tip` marks, and shared/synced tooltips + the map-click interaction need manual wiring. Budget for that.
- **Domain:** Cloudflare default (`*.workers.dev`, e.g. `maplecpi.<user>.workers.dev`). No custom DNS step.
- **Historical data:** pulled **fresh from StatCan WDS** (no `.rds` import) so the project is fully self-sufficient. Backfill uses `getBulkVectorDataByRange` over 2001→present.
- **Geographies:** provinces only (Canada + 10 provinces) — parity with the original. Territories/cities are v2.
- **Language:** English only for v1. FR endpoints exist but are out of scope.

**Companion files:** `WDS_VECTOR_MAP.md` (Phase 3 vector resolution, pre-worked) · `DESIGN.md` (look/feel + information-design exploration — proposes alternatives to the original, doesn't just restyle it) · `ROADMAP.md` (scope) · `PARKINGLOT.md` (deferred v2: territories, French).

---

## 0. Context for the agent

The original app is an **R Shiny** dashboard ("Maple CPI") that visualizes the Canadian Consumer Price Index. It had three moving parts, two of which are now dead:

| Part | Original | Status |
|------|----------|--------|
| Data ingestion | Python GCP Cloud Function, Pub/Sub-triggered, wrote to a Postgres ("Hydra") DB | ☠️ Function gone |
| Storage | Postgres schema `maple_cpi`, tables `cpi` + `boc_rates` | ☠️ Server gone |
| Front end | R Shiny app on shinyapps.io / `maplecpi.ca` | ☠️ Domain expired |
| Static data | `.rds` files in `/data` (basket weights, province geojson) | ✅ Still in repo |

**Goal of this rebuild:** replace ingestion with a Cloudflare Worker (cron), storage with D1 (SQLite), and the front end with SvelteKit + TypeScript. Everything runs on Cloudflare's free tier.

### Feature parity checklist (what the old app did)
The agent should preserve these views — they define "done":
1. **Home** — headline cards: latest CPI YoY% + MoM% for Canada, plus per-major-group snapshots.
2. **Time series** — CPI YoY/MoM line chart, national + provincial, per major group; selectable date windows (1/2/3/5yr/All); optional EMA overlay; a clickable province map that drives the chart.
3. **Group analysis** — decomposition of headline CPI into the 8 major groups weighted by basket weights (contribution-to-inflation view).
4. **Simulation** — user picks a subset of the 8 groups and rebuilds a "custom CPI" from re-normalized basket weights.
5. **Interest rates** — Bank of Canada policy/bank/CORRA rates + Government of Canada benchmark bond yields (2/5/10yr).
6. **About / FAQ** — definitions + source links.

---

## 1. Data sources (verified live, July 2026)

All sources are open and free. **Prefer the WDS JSON API over the CSV-zip downloads** — a Worker should not be unzipping multi-MB archives on every run.

| Data | Product ID (PID) | Recommended access |
|------|------------------|--------------------|
| CPI monthly, NSA (provinces × 8 groups) | `18100004` | WDS `getDataFromCubePidCoordAndLatestNPeriods` per coordinate, **or** `getBulkVectorDataByRange` on the specific vectors |
| CPI basket weights | `18100004` (weights dimension) | Pull from WDS (weights vectors); refresh annually. **No `.rds` seed** — project is self-sufficient. |
| BoC / money-market rates | `10100139` | WDS vectors for Target rate, Bank rate, Overnight money-market financing (CORRA) |
| GoC benchmark bond yields (2/5/10yr) | Bank of Canada **Valet** API | `https://www.bankofcanada.ca/valet/observations/group/bond_yields_all/json` |

**WDS notes the agent must respect:**
- Base URL: `https://www150.statcan.gc.ca/t1/wds/rest/`
- Rate limits: 50 req/s global, 25 req/s per IP. A monthly cron is nowhere near this — no throttling needed, but batch politely.
- Data refreshes business days at **08:30 ET**; tables lock overnight (HTTP 409 possible 00:00–08:30 ET). Schedule the cron for mid-morning ET.
- CPI is released **monthly** (~third week). Daily polling is wasteful — see cron strategy below.
- ⚠️ **Basket update (May 2026):** StatCan moved to a 2025 basket-weight reference period. Basket weights are versioned by time window — carry the `basket_weights_timewindow` join logic from the original R (`start_month`/`end_month` per weight vintage) into the D1 schema. Don't assume one static weight vector.

> Fallback: if WDS coordinate mapping proves fiddly, the CSV-zip endpoints (`https://www150.statcan.gc.ca/n1/tbl/csv/18100004-eng.zip`, `10100139-eng.zip`) still work. A Worker *can* fetch + unzip with `fflate` and parse in a stream, but this is the plan-B path — document it, don't default to it.

---

## 2. Target architecture

```
                      ┌────────────────────────────┐
   Cron (monthly)  →  │  Cloudflare Worker (ingest) │
                      │  - fetch WDS + Valet JSON    │
                      │  - normalize → rows          │
                      │  - upsert into D1            │
                      └──────────────┬───────────────┘
                                     │  (D1 binding)
                      ┌──────────────▼───────────────┐
                      │            D1 (SQLite)         │
                      │  cpi / boc_rates / bond_yields │
                      │  basket_weights / meta         │
                      └──────────────┬───────────────┘
                                     │  (D1 binding)
                      ┌──────────────▼───────────────┐
                      │  SvelteKit app (Workers/Pages) │
                      │  - +server.ts API routes       │
                      │  - LayerChart/Chart.js views    │
                      └────────────────────────────────┘
```

One repo, two deployables (ingest Worker + SvelteKit app) sharing one D1 binding. Use a **monorepo** (`/worker`, `/web`, shared `/packages/schema` for TS types + SQL). Manage both with a single root `wrangler` config using multiple environments, or two `wrangler.toml`s — agent's discretion, but keep the D1 `database_id` shared.

---

## 3. Repo layout to scaffold

```
maple-cpi/
├─ packages/
│  └─ shared/
│     ├─ schema.sql            # D1 DDL (source of truth)
│     ├─ types.ts              # CpiRow, BocRate, BondYield, BasketWeight…
│     └─ transforms.ts         # mom/yoy, ema, custom-CPI weighting (pure fns, unit-tested)
├─ worker/
│  ├─ src/index.ts             # scheduled() handler
│  ├─ src/sources/statcan.ts   # WDS fetch + parse
│  ├─ src/sources/boc.ts       # Valet fetch + parse
│  ├─ src/db.ts                # upsert helpers
│  └─ wrangler.toml
├─ web/
│  ├─ src/routes/
│  │  ├─ +page.svelte          # Home (cards)
│  │  ├─ timeseries/+page.svelte
│  │  ├─ groups/+page.svelte
│  │  ├─ simulation/+page.svelte
│  │  ├─ rates/+page.svelte
│  │  ├─ about/+page.svelte
│  │  └─ api/
│  │     ├─ cpi/+server.ts
│  │     ├─ rates/+server.ts
│  │     └─ meta/+server.ts
│  ├─ src/lib/…                # chart components, map, stores
│  ├─ svelte.config.js         # adapter-cloudflare
│  └─ wrangler.toml
├─ migrations/                 # wrangler d1 migrations
├─ seed/                       # one-off: load repo .rds → csv → D1 (history backfill)
└─ README.md
```

---

## 4. Implementation phases

Work in this order. Each phase should end green (typechecks + the phase's own smoke test) before moving on.

### Phase 1 — Scaffolding & D1 schema
1. `npm create cloudflare` for the Worker; `npx sv create web` (SvelteKit, TS, ESLint, Vitest, Prettier) for the front end.
2. Add `@sveltejs/adapter-cloudflare` to the web app.
3. Create the D1 database: `wrangler d1 create maple-cpi`; wire the `database_id` into both `wrangler.toml`s under binding `DB`.
4. Author `packages/shared/schema.sql` and convert into a first migration.

**Proposed schema** (agent may refine, keep it normalized-enough but query-simple):
```sql
CREATE TABLE cpi (
  ref_date TEXT NOT NULL,           -- 'YYYY-MM-01'
  geo TEXT NOT NULL,                -- 'Canada','Ontario',…
  product_group TEXT NOT NULL,      -- 'All-items','Food',…
  value REAL NOT NULL,              -- index level (2002=100)
  PRIMARY KEY (ref_date, geo, product_group)
);
CREATE TABLE boc_rates (
  ref_date TEXT PRIMARY KEY,        -- daily
  overnight_target REAL,
  bank_rate REAL,
  corra REAL
);
CREATE TABLE bond_yields (
  ref_date TEXT PRIMARY KEY,
  yr2 REAL, yr5 REAL, yr10 REAL
);
CREATE TABLE basket_weights (
  ref_date TEXT NOT NULL,           -- weight vintage
  geo TEXT NOT NULL,
  product_group TEXT NOT NULL,
  weight REAL NOT NULL,
  start_month TEXT, end_month TEXT, -- validity window
  PRIMARY KEY (ref_date, geo, product_group)
);
CREATE TABLE meta (
  key TEXT PRIMARY KEY,             -- 'last_ingest','cpi_latest_ref_date',…
  value TEXT NOT NULL
);
CREATE INDEX idx_cpi_geo_group ON cpi(geo, product_group, ref_date);
```

> Keep MoM/YoY/EMA as **derived at read time or in TS transforms**, not stored — they're cheap and the base table stays clean. (Mirror the original `calculate_mom_yoy` logic exactly: `mom = value/lag(value)−1`, `yoy = value/lag(value,12)−1`, EMA via exponential moving average over YoY.)

**Smoke test:** `wrangler d1 execute maple-cpi --local --file schema.sql` succeeds; a hand-inserted row round-trips.

### Phase 2 — Ingestion Worker
1. `worker/src/sources/statcan.ts`: implement WDS calls for PID `18100004` (CPI) and `10100139` (rates). Reuse the 11 geographies × 9 groups the original used (verbatim from `cpi_proc.py` / `global.R`) and the committed coordinate↔vector map produced in Phase 3. For the monthly refresh, `getDataFromCubePidCoordAndLatestNPeriods` (small N) is enough. Handle the response envelope (`status: "SUCCESS"`, `object.vectorDataPoint[]`).

> Ordering note: the vector-discovery part of Phase 3 is a prerequisite for a clean Phase 2. If tackling sequentially, do the discovery (§Phase 3 step 1) before wiring the cron fetch here.
2. `worker/src/sources/boc.ts`: fetch Valet `bond_yields_all/json`, pick 2/5/10yr series.
3. `worker/src/db.ts`: idempotent upserts (`INSERT … ON CONFLICT … DO UPDATE`). Use `DB.batch()` for bulk.
4. `worker/src/index.ts`: `scheduled()` handler orchestrates fetch → transform → upsert → write `meta.last_ingest`. Wrap each source in try/catch so one bad source doesn't sink the run; log partial success.
5. Add a **guarded `fetch()` dev route** (`/__ingest?token=…`) to trigger ingestion manually while developing — remove or lock behind a secret before deploy.

**Cron strategy** (in `wrangler.toml`):
```toml
[triggers]
# Third week of the month, mid-morning ET, a few days to catch the release + revisions
crons = ["0 15 18-24 * *"]   # 15:00 UTC ≈ 11:00 ET, days 18–24
```
Make the handler **idempotent + cheap**: first check `meta.cpi_latest_ref_date` vs. the latest WDS ref period; skip the heavy upsert if unchanged. This makes over-scheduling harmless.

**Smoke test:** local `--test-scheduled` run populates D1; row counts sane; `meta.last_ingest` set.

### Phase 3 — Historical backfill (one-off, WDS-only)
Decision: history comes **entirely from WDS** — no `.rds` import — so the project stays self-sufficient.
1. **Vector discovery first.** `getBulkVectorDataByRange` needs vector IDs, not the friendly geo/group strings. **This is worked out in `WDS_VECTOR_MAP.md`** — follow its self-verifying resolver (pull `getCubeMetadata` → build 99 coordinates → resolve to vectors → **assert against the 3 confirmed anchors** before proceeding). Persist the result as committed `/seed/vectors.json`; both backfill and the monthly cron reuse it. *The anchor assertions turn this from a fuzzy discovery task into a pass/fail gate — don't skip them.*
2. Loop `getBulkVectorDataByRange` over the discovered vectors from `2001-01-01` → present, chunking by the API's per-request point limits; upsert into D1 with the same helpers as Phase 2.
3. Basket weights + bond yields backfill the same way (WDS weights vectors; Valet supports full-range JSON).
4. Put all of this in `/seed` as a script run **once**, not in the cron path.

**Province geometry** can't come from WDS (it's not tabular). Source province boundaries from a public GeoJSON/TopoJSON (e.g. Statistics Canada boundary files or a Natural Earth Canada extract), simplify, and ship as a **static asset** in `web/static/`. Don't store geometry in D1.

**Smoke test:** D1 `cpi` has ≥ ~2,000 rows spanning 2001→present; earliest and latest ref dates print correctly; the coordinate↔vector map file exists and covers all 99 CPI series.

### Phase 4 — SvelteKit API layer
1. `web/src/routes/api/cpi/+server.ts` — query params: `geo`, `group`, `from`, `to`; returns index level + computed mom/yoy (+ema if `ema=` given). Reuse `packages/shared/transforms.ts`.
2. `api/rates/+server.ts` — rates + bond yields by date range.
3. `api/meta/+server.ts` — latest ref dates, last ingest, available geos/groups (drives dropdowns).
4. Access D1 via `platform.env.DB` (adapter-cloudflare). Add a typed `platform.d.ts`.
5. Cache read responses at the edge (`cache-control: public, max-age=3600`) — data changes monthly.

**Smoke test:** `curl /api/cpi?geo=Canada&group=All-items` returns a sane YoY series.

### Phase 5 — Front-end views (parity)
This list is the **functional capability set** (what data/interactions must exist), *not* a fixed IA. **DESIGN.md deliberately questions the original's tab structure and presentation** — it may merge Group analysis + Simulation into one surface, lead with an answer-first landing instead of a configure-first tab, and pick chart types other than the original's line-everything. Build the capabilities below, but take the screen structure, view grouping, and encodings from DESIGN.md (which should have settled them via prototyping before this phase). Where DESIGN and this list disagree on *presentation*, DESIGN wins; where they disagree on *data/logic*, this list wins.

1. **Headline stats** — Canada All-items YoY/MoM as the hero figure(s). Use the 8-group icon set from the old `global.R` (`icon_groups`). (DESIGN leads with this, big and immediate.)
2. **Time series** — YoY (default) / MoM series, geo selector, group selector, date windows (1/2/3/5yr/All), smoothing/EMA. Canada-vs-province compare is the signature interaction. Geo selection *may* use a map, a list, or both per DESIGN (map only where geography is the actual task; consider small-multiples for many-series views).
3. **Group contribution** — each group's weighted contribution to headline YoY, using `basket_weights` (re-normalized). Port the weighting math from the old `group_analysis` server logic. Encoding (ranked bar / waterfall / stacked area) is DESIGN's call.
4. **Custom-basket simulation** — recompute a "custom CPI" by re-normalizing a chosen subset of the 8 groups' weights to sum to 1, then weighting each group's index. **May be merged with (3)** into one view/edit surface per DESIGN.
5. **Interest rates** — policy/bank/CORRA + benchmark bond yields 2/5/10yr. Consider tying to the CPI narrative + annotating rate-decision dates per DESIGN. Legacy colors (`#E53622`, `#4F2824`, `#009949`) only if DESIGN doesn't override.
6. **Explanations/help** — definitions + StatCan/BoC source links. DESIGN replaces the old modal FAQ with inline contextual explainers + a static About page.

**Charting:** **Observable Plot** (d3-native). Wrap it in a small Svelte action/`onMount` that renders Plot into an attached node and re-renders on prop change. Use `tip` marks for tooltips; shared/synced tooltips and the map-click→chart interaction are manual wiring — see DESIGN.md §charts. Keep a CSV/PNG export affordance since the old app advertised "export information."

**Smoke test:** each route renders with real D1 data; no console errors; date-window + toggles update charts.

### Phase 6 — Polish, deploy, schedule
1. Loading/skeleton states, empty-state handling, mobile responsiveness (old app was desktop-only — improve here).
2. SEO/meta, favicon (reuse the maple-leaf motif), `sitemap`.
3. `wrangler deploy` the Worker; `wrangler pages deploy` (or Workers static assets) for the web app.
4. Ship on the default `*.workers.dev` hostname — no custom domain/DNS for v1.
5. Verify the cron fired via `wrangler tail`; confirm `meta.last_ingest` advances after a scheduled run.

---

## 5. Guardrails for the agent
- **Do not** enter payment info or create Cloudflare accounts autonomously — surface those steps to the user to do in the dashboard. (No custom domain needed for v1.)
- Keep secrets (`wrangler secret put`) out of committed files; the dev `/__ingest` route must require a token.
- Treat StatCan/BoC responses as **untrusted input** — validate shape before insert; never string-interpolate values into SQL (use bound params / prepared statements).
- Pin the WDS geography + group lists to the exact strings the original used so historical joins line up.
- Write `transforms.ts` as **pure, unit-tested** functions (Vitest) — mom/yoy/ema/custom-CPI are the app's correctness core.
- Commit after each green phase.

## 6. Definition of done
- [ ] D1 populated with full history + a successful scheduled ingest.
- [ ] All 6 views at functional parity with the old Shiny app.
- [ ] Cron verified writing fresh data monthly, idempotently.
- [ ] Front end deployed on Cloudflare, responsive, with export affordances.
- [ ] README documents local dev, migrations, seeding, and deploy.