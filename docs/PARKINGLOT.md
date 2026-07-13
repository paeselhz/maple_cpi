# PARKINGLOT.md — deferred scope

> Items intentionally **out of v1** but expected as next steps. Parked here so the v1 build stays clean while keeping the path back obvious. Each entry notes *why deferred*, *what v1 should do now to not block it*, and *the work when picked up*.

---

## 1. Territories & cities (Whitehorse, Yellowknife, Iqaluit, provincial cities)

**Status:** parked for v2. v1 ships **provinces only** (Canada + 10 provinces), matching the original app.

**Why deferred**
- Keeps v1 at true parity with the original and avoids UI/geography scope creep.
- Territory/city series in table `18100004` have **shorter and patchier histories** than provinces (Iqaluit especially), so charts need empty-state and partial-range handling that isn't worth building until the core is solid.
- The province map component is clean with 11 well-known polygons; adding territories/cities complicates the map and the geo selector.

**What v1 should do now so this isn't painful later** (cheap insurance)
- In `WDS_VECTOR_MAP.md`, the geography member IDs beyond the provinces (`282, 285, 287, 288`, plus any city members) are already visible in the cube metadata — **don't delete or special-case them in a way that's hard to reverse.** Just filter to the 11 v1 geos at the *query* level, not by hardcoding assumptions elsewhere.
- Keep `geo` a plain string column in D1 with no province-only constraints, so territory/city rows can be added without a migration.
- Make the geo selector data-driven off `api/meta` (available geographies) rather than a hardcoded list of 11 — then adding geos is a data change, not a code change.

**Work when picked up**
- Extend `vectors.json` resolution to include territory/city geos (same resolver, more members — re-run and re-verify anchors).
- Backfill the added vectors.
- Map component: add territory/city markers or a fallback list (some cities have no polygon — show as pins or a secondary selector).
- Add partial-history / empty-state handling to charts for short series.
- Decide whether cities belong on the province map or in a separate "cities" view.

**Rough size:** small–medium. Mostly data + map UX; no architectural change if the v1 insurance above is honored.

---

## 2. French language (bilingual EN/FR)

**Status:** parked for v2. v1 ships **English only**.

**Why deferred**
- Bilingual doubles the copy/QA surface and adds i18n plumbing that would slow the v1 core.
- The audience is Canadian, so FR is a genuine next step (not a maybe) — but it's cleanly separable from getting the data + charts right first.

**What v1 should do now so this isn't painful later** (cheap insurance)
- **Don't inline user-facing strings** in components. Even without an i18n library, centralize copy in a single `src/lib/strings.ts` (or per-route constants) so a later `en`/`fr` split is a lookup swap, not a component rewrite.
- StatCan WDS returns **both** `memberNameEn` and `memberNameFr`, and every table has an `-fra` endpoint mirroring `-eng`. Store the **language-neutral keys** (geo/group as stable identifiers) in D1, and keep display labels in the front-end string layer — so French labels are a front-end concern, not a data re-ingest.
- Keep number/date formatting locale-aware from the start (`Intl.NumberFormat` / `Intl.DateTimeFormat`) even if only `en-CA` is wired up now.
- Reserve a routing strategy: decide early (even if unbuilt) whether FR will be `/fr/...` path-prefixed or a runtime toggle. Path-prefixed is simpler with SvelteKit and better for SEO.

**Work when picked up**
- Add an i18n layer (e.g. `sveltekit-i18n` / `paraglide` / typesafe-i18n) and split `strings.ts` into `en` + `fr`.
- Translate all UI copy + the About/FAQ content (the biggest single chunk — the original's FAQ text is substantial).
- Wire French dimension labels from the `Fr` metadata fields for geo/group display.
- `/fr` routes + a language toggle in the header; set `lang` attribute and `hreflang` tags.
- QA pass with a French speaker — economic terminology (e.g. "indice des prix à la consommation") should match StatCan's official French wording, not a literal translation.

**Rough size:** medium. Plumbing is straightforward; the translation + terminology QA is the real cost.

---

## Not parked — explicitly dropped for now
These came up in analysis but aren't planned next steps (recorded so they don't get silently re-litigated):
- **Forecasting / modelling** — out of scope; the app visualizes published data only.
- **Personal inflation calculator** — StatCan already ships one; revisit only if there's a clear differentiator.
- **Custom domain** — staying on `*.workers.dev` for v1; re-open only if the project warrants branding.

---

## Review trigger
Revisit this file when v1 is live and stable (post-`v1.0` in ROADMAP.md). Territories and French are the two committed next steps, in that order unless there's demand pull for French sooner.