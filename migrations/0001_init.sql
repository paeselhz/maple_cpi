-- Maple CPI — D1 (SQLite) schema. Source of truth for the DB shape.
-- MoM/YoY/EMA are derived at read time in packages/shared/transforms.ts, never stored.

CREATE TABLE IF NOT EXISTS cpi (
  ref_date      TEXT NOT NULL,          -- 'YYYY-MM-01'
  geo           TEXT NOT NULL,          -- 'Canada','Ontario',… (language-neutral key)
  product_group TEXT NOT NULL,          -- 'All-items','Food',…
  value         REAL NOT NULL,          -- index level (2002=100)
  PRIMARY KEY (ref_date, geo, product_group)
);

CREATE TABLE IF NOT EXISTS boc_rates (
  ref_date         TEXT PRIMARY KEY,    -- daily 'YYYY-MM-DD'
  overnight_target REAL,
  bank_rate        REAL,
  corra            REAL
);

CREATE TABLE IF NOT EXISTS bond_yields (
  ref_date TEXT PRIMARY KEY,            -- daily 'YYYY-MM-DD'
  yr2      REAL,
  yr5      REAL,
  yr10     REAL
);

CREATE TABLE IF NOT EXISTS basket_weights (
  ref_date      TEXT NOT NULL,          -- weight vintage
  geo           TEXT NOT NULL,
  product_group TEXT NOT NULL,
  weight        REAL NOT NULL,          -- percent (0..100), as published
  start_month   TEXT NOT NULL,          -- validity window (inclusive)
  end_month     TEXT NOT NULL,          -- validity window (inclusive)
  PRIMARY KEY (ref_date, geo, product_group)
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,               -- 'last_ingest','cpi_latest_ref_date',…
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cpi_geo_group ON cpi (geo, product_group, ref_date);
CREATE INDEX IF NOT EXISTS idx_weights_lookup ON basket_weights (geo, product_group, start_month, end_month);
