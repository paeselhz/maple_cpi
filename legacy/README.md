# Legacy — original Maple CPI (R/Shiny)

This directory preserves the **original** Maple CPI application for reference. It is
**not** part of the running project and is not maintained. The live app is the
Cloudflare + SvelteKit rebuild at the repo root (see [`../README.md`](../README.md)).

Contents:
- `global.R`, `server.R`, `ui.R`, `tabs/`, `functions/` — the R/Shiny dashboard.
- `cloud_function/` — the Python GCP Cloud Function that ingested StatCan CSVs into Postgres.
- `data/` — the original static `.rds` files (CPI history, basket weights + time windows,
  BoC rates, province geometry). The rebuild pulls history fresh from StatCan WDS instead;
  the province GeoJSON at `web/static/geo/provinces.geojson` was derived from
  `data/map_provinces.rds`, and the basket weight windows in `packages/shared` were
  cross-checked against `data/basket_weights_timewindow.rds`.
- `Dockerfile`, `renv.lock`, `maple_cpi.Rproj`, `www/` — original build/runtime assets.

Why kept: the R server logic (`calculate_mom_yoy`, `group_analysis`, `simulation`) is the
reference the rebuild's `packages/shared/transforms.ts` was ported from, and the `.rds`
files document the basket-weight vintages.
