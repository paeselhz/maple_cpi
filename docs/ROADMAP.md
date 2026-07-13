# ROADMAP.md — Maple CPI

> Analysis of the existing project, what the rebuild **is / isn't**, what it **does**, caveats, highlights, and a phased path forward.

**Decisions locked (v1):** Observable Plot for charts · default `*.workers.dev` domain (no custom DNS) · history pulled fresh from StatCan WDS (no `.rds` import) · provinces only · English only.

---

## 1. Project analysis (what exists today)

**Maple CPI** ([`paeselhz/maple_cpi`](https://github.com/paeselhz/maple_cpi/tree/main)) is an R Shiny dashboard for exploring the Canadian Consumer Price Index and Bank of Canada rates. It's a genuinely nice piece of work — coherent identity, thoughtful progressive-disclosure IA, real analytical depth (basket-weighted decomposition, custom-CPI simulation). Three-tier architecture:

- **Ingestion:** a Python **GCP Cloud Function** (Pub/Sub-triggered) downloaded StatCan CSV zips for CPI (`18100004`) and money-market rates (`10100139`), cleaned them with pandas, and wrote to a **Postgres** DB (referred to as "Hydra").
- **Storage:** Postgres schema `maple_cpi`, tables `cpi` and `boc_rates`. Plus static `.rds` files in `/data` for basket weights and province geometry.
- **Front end:** R Shiny app (Highcharts + Leaflet), hosted on shinyapps.io behind `maplecpi.ca`.

### Current state
| Component | State |
|-----------|-------|
| Cloud Function | ☠️ Gone |
| Postgres server (GCP) | ☠️ Gone |
| Domain `maplecpi.ca` | ☠️ Expired |
| Shiny app code | ✅ Intact in repo |
| Static `.rds` data | ✅ Intact (`cpi_transformed`, `boc_rates`, `basket_weights`, `basket_weights_timewindow`, `map_provinces`) |
| Upstream data sources | ✅ **All live** (verified July 2026) |

### Highlights (strengths to preserve)
- **Clean data model.** The CPI table is just `ref_date × geo × product_group × value`; rates pivot to `target/bank/corra`. Trivially portable to D1/SQLite.
- **Real analytics, not just charts.** MoM/YoY with lag(12), EMA smoothing, basket-weighted group contribution, and a genuinely clever **custom-CPI simulation**.
- **Good IA.** Simple → advanced flow is the right mental model for a mixed audience.
- **Strong identity.** Maple motif, warm coral palette, Montserrat, per-group icons — cohesive and worth carrying forward.

### Caveats / risks (things that bit the original, or will)
- **Highcharts licensing** *(resolved).* The original used Highcharts (commercial for many uses). The rebuild uses **Observable Plot** instead — d3-native, no license concern. Trade-off: Plot is declarative-static, so interactive tooltips (`tip` marks) and the map-click interaction need explicit wiring.
- **Basket-weight versioning.** StatCan updated the CPI basket with **May 2026 data (2025 reference period)**. Weights are time-windowed (`basket_weights_timewindow` with `start_month`/`end_month`). Any decomposition/simulation must respect the correct vintage per period, or contributions will be subtly wrong. This is the single most error-prone piece.
- **CSV-zip ingestion is heavy.** Downloading + unzipping multi-MB archives is a poor fit for a Worker. The rebuild should prefer the WDS JSON API; keep CSV-zip only as fallback/backfill.
- **Overnight data locks.** StatCan tables can return HTTP 409 between 00:00–08:30 ET. Cron must schedule around this.
- **Release cadence mismatch.** CPI is monthly (~3rd week); rates/bonds are daily. One cron can handle both, but poll monthly for CPI and treat ingestion as idempotent.
- **Backfill via WDS, not `.rds`.** Decision: pull full 2001→present history fresh from WDS (`getBulkVectorDataByRange`) rather than converting the repo's `.rds`, keeping the project self-sufficient. The real work is **vector discovery** — mapping the 99 CPI series (11 geos × 9 groups) + rate series to WDS vector IDs up front. This is the build's main unknown; do it before the range loop.
- **Province geometry.** Not available from WDS (it's not tabular). Source province boundaries from a public GeoJSON/TopoJSON (StatCan boundary files or a Natural Earth Canada extract), simplify, and ship as a static asset; don't store geometry in D1.
- **Desktop-only UX.** The original assumed a wide viewport. Mobile is a first-class requirement for the rebuild.
- **No tests on the math.** The correctness core (mom/yoy/ema/custom-CPI) had no unit tests. Add them.

---

## 2. Target stack (the rebuild)

| Layer | From | To |
|-------|------|-----|
| Ingestion | Python GCP Cloud Function + Pub/Sub | **Cloudflare Worker** (cron `scheduled()`) |
| Storage | Postgres (GCP) | **Cloudflare D1** (SQLite) |
| Front end | R Shiny (Highcharts/Leaflet) | **SvelteKit + TypeScript** (Observable Plot) |
| Hosting | shinyapps.io (`maplecpi.ca`) | **Cloudflare** (Workers/Pages), default `*.workers.dev` |
| Cost | paid GCP + hosting | **free tier** |

---

## 3. Scope — what this rebuild IS / ISN'T / DOES

### ✅ IS
- A faithful, modernized **rebuild** of Maple CPI's feature set on a free, low-maintenance Cloudflare stack.
- **Feature-parity-first on *capability*, not layout**: headline stats, national+provincial time series, group contribution, custom-basket simulation, interest-rate/bond charts, explanations. **DESIGN.md reworks how these are presented** — questioning the original's configure-first tabs and line-everything defaults, and exploring answer-first / small-multiples / ranked-contribution alternatives. Parity means "does everything the old app did," not "looks like it."
- **Self-updating**: a monthly cron keeps CPI/rates current with no manual intervention.
- **Mobile-responsive** and lighter-weight than the original.

### ❌ ISN'T (out of scope, at least for v1)
- **Not** a port of R code to another language line-for-line — it's a re-implementation of the *logic*, not the R.
- **Not** a forecasting/modeling tool — no inflation prediction, no econometric models. It visualizes official data as published.
- **Not** a personal-finance calculator (StatCan already ships a "Personal Inflation Calculator" — don't duplicate it in v1).
- **Not** authenticated/multi-user — it's a public read-only dashboard. No accounts, no user data.
- **Not** real-time — data is monthly/daily as StatCan/BoC publish; no intraday.
- **Not** covering territories/cities — v1 keeps the original's 11 geographies (Canada + 10 provinces). Whitehorse/Yellowknife/Iqaluit are a v2 add.
- **Not** bilingual — English only for v1 (StatCan FR endpoints exist; EN/FR is a v2 concern).
- **Not** on a custom domain — v1 launches on the default `*.workers.dev` hostname.

### ⚙️ DOES (functional capabilities)
- Fetches CPI (`18100004`) and money-market rates (`10100139`) from StatCan WDS, plus GoC bond yields from the Bank of Canada Valet API.
- Normalizes and upserts into D1 idempotently on a monthly schedule.
- Serves computed **MoM / YoY / EMA** series and basket-weighted **group contributions** via SvelteKit API routes.
- Lets users filter by geography, group, and date window; toggle YoY/MoM and EMA; click a province map; and build a **custom CPI** from a chosen subset of groups.
- Exports chart data (CSV/PNG).

---

## 4. Phased roadmap

### v0.1 — Foundations
- Monorepo scaffold, D1 schema + migrations, Worker skeleton, SvelteKit app with adapter-cloudflare.
- **Exit:** schema deployed, empty app builds and deploys.

### v0.2 — Data pipeline
- WDS + Valet ingestion in the Worker; idempotent upserts; monthly cron; `meta.last_ingest`.
- One-time **historical backfill** (WDS range loop *or* `.rds`/CSV import).
- **Exit:** D1 holds full history (2001→present); a scheduled run refreshes it.

### v0.3 — Core views
- Home cards + Time series (map, geo/group selectors, date windows, YoY/MoM, EMA).
- API routes + unit-tested transforms.
- **Exit:** the two most-used screens work on live data, desktop + mobile.

### v0.4 — Analytical views
- Group analysis (contribution) + Simulation (custom CPI), both respecting basket-weight vintages.
- Interest rates + bond yields.
- **Exit:** full parity with the original's tabs.

### v0.5 — Polish & launch
- About/FAQ, export affordances, SEO/meta, skeleton states, responsiveness pass, accessibility (color-independent signals, aria chart summaries).
- Deploy on the default `*.workers.dev` hostname; cron verified in production.
- **Exit:** publicly live, self-updating, at/above original parity.

### v1.0 — Stability
- Monitoring/alerting on ingest failures (e.g., a `meta` staleness check + email/Slack on miss).
- README + runbook (dev, migrate, seed, deploy, recover).

### Beyond v1 (nice-to-haves, explicitly *not* committed)
> The two **committed** next steps — territories/cities and French — are detailed in **PARKINGLOT.md**, including the cheap "insurance" v1 should honor now so they're not painful later.
- Territories + select cities (Whitehorse/Yellowknife/Iqaluit). *(see PARKINGLOT.md)*
- Bilingual (EN/FR) — StatCan ships French endpoints; the audience is Canadian. *(see PARKINGLOT.md)*
- Core-inflation measures (CPI-trim / CPI-median / CPI-common) via BoC/StatCan tables.
- Personal-inflation calculator (weight groups by *your* spending).
- Shareable deep-linked chart states / embeddable widgets.
- Annual data (`18100005`) and seasonally-adjusted series (`18100006`) as toggles.
- Email digest on new CPI release.

---

## 5. Resolved decisions
All pre-build questions are settled:
1. **Domain** — default Cloudflare `*.workers.dev`; `maplecpi.ca` will not be renewed. No DNS work in v1.
2. **Backfill** — pulled fresh from StatCan WDS (no `.rds` import) for self-sufficiency. Vector discovery is the first backfill task.
3. **Charts** — Observable Plot (off Highcharts; d3-native, no license concern).
4. **Geographies** — provinces only (parity with the original); territories/cities are v2.
5. **Language** — English only for v1; bilingual is v2.

No open blockers — ready to hand to a Claude Code session per BUILD_PLAN.md.