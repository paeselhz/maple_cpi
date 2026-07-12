# WDS_VECTOR_MAP.md — resolving StatCan vectors for the backfill

> Pre-work for **Phase 3** of BUILD_PLAN.md. This de-risks the one genuinely uncertain part of the build: mapping the CPI + rate series to StatCan WDS vector IDs so `getBulkVectorDataByRange` pulls the *right* data. It gives the agent a **deterministic, self-verifying** procedure plus confirmed anchor values to assert against — rather than a blind hardcoded list.

---

## Why this needs care

`getBulkVectorDataByRange` addresses data by **vector ID** (e.g. `v41690973`), not by the friendly `geo` / `product_group` strings. A wrong vector doesn't error — it silently returns a *different, valid-looking* series. So the map must be **derived and then verified**, never guessed. This file gives you two independent paths (coordinate-based and vector-based) that must agree, plus known-good anchors to check against.

---

## Verified facts (confirmed live, July 2026)

**Table 18100004** ("CPI, monthly, not seasonally adjusted") has **two** real dimensions, in this order:
1. Geography
2. Products and product groups

WDS coordinates are always **10 slots**, dot-separated, right-padded with zeros. So every series in this table is:

```
<geoMemberId>.<productMemberId>.0.0.0.0.0.0.0.0
```

**Confirmed vector anchors** (from StatCan + the `cansim` R package docs — treat these as ground-truth assertions):

| geo | product | vectorId |
|-----|---------|----------|
| Canada | All-items | `v41690973` |
| British Columbia | All-items | `v41692462` |
| Saskatchewan | All-items | `v41694489` |

**Geography member IDs** — extracted from the official table page's "Download selected data" link (`selectedMembers` parameter). The geography dimension's members, in the table's own order, begin:

```
2, 3, 79, 96, 139, 176, 184, 201, 219, 256, 274, 282, 285, 287, 288
```

Member `2` = **Canada** (first listed). The next ten members `3, 79, 96, 139, 176, 184, 201, 219, 256, 274` correspond to the ten provinces (in StatCan's standard east-to-west ordering); the trailing IDs (`282, 285, 287, 288`) are the territories/cities we are **excluding** for v1 (see PARKINGLOT.md).

> ⚠️ Do **not** treat the province member-ID order as folklore — confirm it in step 1 below via `getCubeMetadata`. The list above is the anchor to check the metadata against, not a substitute for reading it.

The **9 product groups** we need (verbatim strings, matching the original app):
`All-items`, `Food`, `Shelter`, `Household operations, furnishings and equipment`, `Clothing and footwear`, `Transportation`, `Health and personal care`, `Recreation, education and reading`, `Alcoholic beverages, tobacco products and recreational cannabis`.

The **11 geographies** (v1 scope): `Canada` + the 10 provinces (`Newfoundland and Labrador, Prince Edward Island, Nova Scotia, New Brunswick, Quebec, Ontario, Manitoba, Saskatchewan, Alberta, British Columbia`).

→ **11 geos × 9 groups = 99 CPI series** to resolve.

---

## Resolution procedure (for the seed script)

Run this **once**, offline, and commit the output as `/seed/vectors.json`. The monthly cron then reads that file — it never re-resolves.

### Step 1 — Pull authoritative cube metadata
```
POST https://www150.statcan.gc.ca/t1/wds/rest/getCubeMetadata
Content-Type: application/json
Body: [{"productId": 18100004}]
```
From the response, read `object.dimension[]`. For each dimension, `member[]` gives `{ memberId, memberNameEn, parentMemberId, … }`.
- Dimension 0 → Geography members. Build `geoNameEn → memberId`.
- Dimension 1 → Products members. Build `productNameEn → memberId`.

**Assert:** the Geography map contains `Canada → 2`. If not, StatCan reordered members — stop and re-inspect.

### Step 2 — Build the 99 coordinates
For each of the 11 geo names × 9 product names, look up member IDs and form:
```
`${geoId}.${productId}.0.0.0.0.0.0.0.0`
```

### Step 3 — Resolve coordinates → vector IDs
For each coordinate:
```
POST https://www150.statcan.gc.ca/t1/wds/rest/getSeriesInfoFromCubePidCoord
Content-Type: application/json
Body: [{"productId": 18100004, "coordinate": "<coord>"}]
```
Response `object.vectorId` is the vector. (You can batch these — the endpoint accepts an array of objects.)

### Step 4 — Verify against anchors (mandatory gate)
Before writing `vectors.json`, assert all three:
- `Canada / All-items` resolved to `v41690973`
- `British Columbia / All-items` resolved to `v41692462`
- `Saskatchewan / All-items` resolved to `v41694489`

If any assertion fails, **abort** — the member-ID mapping is wrong and the whole map is suspect. Do not proceed to backfill.

### Step 5 — Backfill
With the verified `vectors.json`, loop `getBulkVectorDataByRange` over the 99 vectors from `2001-01-01` → present, chunking to respect per-request point limits, and upsert into D1.

```
POST https://www150.statcan.gc.ca/t1/wds/rest/getBulkVectorDataByRange
Content-Type: application/json
Body: {
  "vectorIds": ["41690973", …],   // note: numeric, no "v" prefix here
  "startDataPointReleaseDate": "2001-01-01T00:00",
  "endDataPointReleaseDate": "2026-12-31T23:59"
}
```
> Quirk to remember: `getBulkVectorDataByRange` wants **numeric** vector IDs (strip the `v`), while `getSeriesInfoFromVector` and the friendly docs use the `v`-prefixed form. Normalize in one helper.

---

## Bank of Canada rates (table 10100139)

Same procedure, simpler. Three series, one geography (Canada). Resolve via `getCubeMetadata` on `10100139`, find the member IDs for the "Financial market statistics" dimension values:
- `Target rate` → `overnight_target`
- `Bank rate` → `bank_rate`
- `Overnight money market financing` → `corra`

Resolve each to its vector, verify the series titles come back matching, then backfill the same way. (The original filtered these to `ref_date >= 2002-01-01`; keep that floor.)

## Bond yields (Bank of Canada Valet — not StatCan)

No vectors involved. Fetch full history directly:
```
GET https://www.bankofcanada.ca/valet/observations/group/bond_yields_all/json
```
Pick the 2yr / 5yr / 10yr benchmark series from the response; map to `yr2/yr5/yr10`.

---

## What the agent should commit
- `/seed/vectors.json` — the verified `{ geo, group, coordinate, vectorId }` records (99 CPI + 3 rate).
- `/seed/resolve-vectors.ts` — the script implementing steps 1–4, **with the three anchor assertions as hard failures**.
- A short note in the repo README: "vectors.json is generated, not hand-authored; re-run resolve-vectors.ts if StatCan restructures table 18100004."

## Honest caveat
The anchors, dimension structure, coordinate padding scheme, and geography member IDs here are **confirmed**. The full 99-vector list is **not hardcoded** on purpose: without live WDS access to verify each one, a hand-typed list risks silent wrong-series bugs. The self-verifying resolver above is the safer artifact — it derives the map fresh and refuses to proceed unless it reproduces the known-good anchors. Expect step 1–4 to take the agent one short pass; the anchors turn a fuzzy discovery task into a pass/fail check.