# DESIGN.md — Maple CPI visual & UX direction (for Claude Design)

> How to design the SvelteKit front end. The brief is **not** "port the old Shiny app prettier." It's: **understand what existed, criticize it honestly, and explore what could be done better.** The original was heavily shaped by Shiny's constraints and by the author's own admitted "not always good" assumptions — a rebuild is the moment to question those, not inherit them. BUILD_PLAN.md owns the engineering; this doc owns look, feel, and information design.

---

## 0. How to use this document

Claude Design should treat this as a **starting position to push against**, not a spec to execute. For each screen there's (a) what the original did, (b) an honest critique, and (c) alternative directions to prototype and compare. **Prototype more than one direction where it's noted, then argue for a pick.** The only things that are near-fixed are the small set of identity anchors in §1 — everything else is open for a better idea.

A good outcome is: "I looked at what existed, here's what was load-bearing vs. what was a Shiny artifact, here are 2–3 ways to present this, and here's the one I'd ship and why." Bring criticism. If something here is wrong, say so.

---

## 1. Identity anchors (keep) vs. inherited assumptions (challenge)

Be deliberate about the difference. A few things are genuine brand equity worth carrying; most of the rest is just "how Shiny made you do it."

**Anchors — keep (or evolve, don't discard casually):**
- **Name + maple motif.** "Maple CPI" (Canadian symbol + the CPI acronym) and a leaf logomark. This is the identity. Evolve the execution, keep the idea.
- **The thesis.** "Legible to an ordinary person worried about their bills in ~3 seconds, *and* a real tool for someone who wants to dig." Every design decision serves this dual audience. This is the north star.
- **A warm, Canadian, non-cliché register.** Warm over cold, human over terminal. (The specific coral is negotiable — see §2.)

**Inherited assumptions — challenge every one:**
| Original choice | Was it a real decision or a Shiny artifact? | Worth reconsidering? |
|---|---|---|
| Top **tab bar** (Home/Time series/Groups/Simulation/Rates/About) | Shiny `tabPanel` default | Yes — is tabs even the right IA? See §3. |
| **Info cards** with big % numbers | Genuine, and good | Keep the intent; the execution can be bolder. |
| **Province map as primary geo selector** | Nice, but Leaflet made it heavy | Yes — is a full map the best selector, or sometimes overkill? |
| **Highcharts** everywhere, one chart per view | Tool default | Yes — chart *type* per question is under-explored. |
| **Separate "Simulation" and "Group analysis" tabs** | Reasonable | Maybe — are these two views of one idea? |
| **Desktop, fixed-width columns, 600px charts** | Shiny limitation | Definitely — mobile-first, fluid. |
| **Wordy welcome copy, FAQ in modal popups** | `sweetAlert` convenience | Yes — rethink onboarding + help entirely. |
| **Everything behind clicks** (pick geo, pick group, pick range, then look) | Shiny's input→render loop | **Big one.** The original makes you configure before you see anything. Flip it: show a strong default view immediately, let controls refine. |

That last row is the most important critique of the original: **it's configure-first, not answer-first.** A person lands and has to make choices before the app tells them anything. The rebuild should lead with an answer.

---

## 2. Palette — a starting point, not a mandate

The original's warm coral (`#E87D6B`) + red/maroon/green chart triad was pleasant but a little arbitrary (and the green-vs-red risks implying "good/bad" inflation, which is a real semantic trap). Treat the tokens below as **direction v1**, and prototype at least one alternative mood.

**Direction A — "Warm ledger" (evolves the original):**
| Token | Value | Use |
|-------|-------|-----|
| `--accent` | `#E4572E` | primary series, active states |
| `--accent-soft` | `#F4C9BC` | washes, hovers |
| `--maroon` | `#4F2824` | secondary series |
| `--green` | `#0A8754` | tertiary series *only* — not "good" |
| `--ink` | `#1C1A19` | text |
| `--paper` | `#FBF7F4` | warm off-white bg |
| `--surface` | `#FFFFFF` | cards |
| `--muted` | `#8A817C` | axes, captions |

**Alternatives worth mocking (pick or synthesize):**
- **"Cool authority"** — a restrained blue/slate base with a single warm accent, reading more like a credible data institution. Tests whether "warm" or "trustworthy" should dominate.
- **"Editorial"** — near-monochrome ink-on-paper with one accent, treating the app like a data-journalism piece (think a newspaper's economics section). Leans into the "explain my bills" audience.
- **Sequential/diverging scales for the *data itself*** are a separate, more important question than brand color — see §4 on encoding.

**Semantic guardrail (non-negotiable):** inflation going *up* is not "bad-red" and *down* is not "good-green." Don't let brand color imply a value judgment on the data. If you use diverging color on inflation, anchor it on *acceleration vs. deceleration* or *above/below target*, label it explicitly, and never rely on color alone.

---

## 3. Information architecture — rethink it, don't inherit it

The original: six top tabs, each a configure-then-view panel. Before committing to that, prototype and weigh alternatives:

- **Direction 1 — Scrollytelling home + tools.** The landing page *is* the answer: headline inflation, what's driving it, and rates, in a single scannable narrative scroll ("Here's Canadian inflation right now → here's who's driving it → here's what the Bank of Canada is doing"). Power tools (time series, simulation) live one layer down for people who want to dig. Serves the "3-second legibility" thesis far better than a tab bar.
- **Direction 2 — Dashboard overview + drill-down.** A single overview screen with live tiles (headline, top contributors, rate); each tile is a doorway into its deep view. More "product," less "article."
- **Direction 3 — Keep tabs, but answer-first inside each.** If tabs win for familiarity, at minimum every tab must open on a strong default (Canada, All-items, sensible range) with data already on screen — controls refine, they don't gate.

Whichever wins, apply the **answer-first** principle everywhere: no blank states waiting for input. Also reconsider whether **Group analysis** and **Simulation** are really two things or two modes of one "what's in the basket / what if I change it" surface — merging them may be clearer than the original's split.

---

## 4. Information design — the richest place to do better

The original showed almost everything as a **line chart** (plus one map). That's a Highcharts-comfort default, not a considered match of chart-type to question. This is where exploration pays off most. For each question the app answers, pick the encoding that fits — and prototype competing encodings.

- **"What's inflation right now / over time?"** — line/area is genuinely right here. But consider a **small-multiples** grid (one sparkline per group or per province) to show *many* series at a glance without the old app's one-at-a-time clicking.
- **"Who's driving inflation?" (group contribution)** — the original stacked things into one chart. Alternatives to weigh: a **horizontal bar / diverging bar** of each group's contribution to headline YoY (instantly ranks the culprit); a **waterfall** from 0 → headline; a **stacked-area over time** to show how the mix shifts. Bar-ranked is likely more legible than the original's stack for "who's the culprit."
- **"How do provinces compare?"** — the map is charming but a poor *comparison* tool (hard to rank colors by eye). Consider **map for geography selection, but a ranked bar or dot plot for actual comparison**, or a connected **strip/beeswarm**. Prototype map-vs-bar for the compare task specifically.
- **"What's my custom basket do?"** — beyond a line overlay, consider showing the **delta** (your basket vs. official) as the hero number, and the weight reallocation as a small visual, so the *result* leads.
- **Rates** — line is fine; consider annotating **rate-decision events** on the axis so the chart tells a story, not just a squiggle.

**Cross-cutting encoding principles:** tabular-nums everywhere; direction glyphs + labels alongside any up/down color; annotate the "now" point; make the single most important number on each screen unmistakably the biggest thing.

---

## 5. Screen-by-screen: existed → critique → explore

For each: prototype the noted alternatives, then recommend.

### Landing / Home
- **Existed:** big welcome paragraph, a row of headline cards, then you go elsewhere to actually explore.
- **Critique:** copy-heavy, and it *describes* instead of *showing*. The headline number is good but under-dramatized; the intro prose buries it.
- **Explore:** lead with the single headline number huge and immediate ("Prices are up **X%** over the last year"), a one-line plain-language gloss, then the top 2–3 driving groups as a mini contribution strip, then a rate line — all above the fold, no configuration. Relegate "what is CPI" to a link/expandable, not a wall of text. Prototype the scrollytelling vs. dashboard framings from §3 here first, since Home sets the whole model.

### Time series (the workhorse)
- **Existed:** map on the left, one line chart on the right, YoY/MoM, EMA toggle, date windows; compare Canada vs. one province.
- **Critique:** solid but configure-heavy and single-series-at-a-time. The map earns its space here (geographic selection is the point), but everywhere *else* the map was overkill.
- **Explore:** keep the Canada-vs-province compare as signature, but add a **small-multiples** option to see all provinces (or all groups) at once. Rethink the EMA toggle — is a smoothing control the right power-user affordance, or would "show 3-month trend" plain-language framing serve better? On mobile, map → segmented control or a tidy list, not a shrunk map.

### Group analysis + Simulation (consider merging)
- **Existed:** two separate tabs — one shows group contributions, one lets you rebuild a custom CPI.
- **Critique:** these are arguably the same mental model ("the basket is made of weighted groups") in view mode vs. edit mode. Splitting them hides that relationship.
- **Explore:** one surface — see the basket's contributions, then *toggle groups off/on to see your own*. The contribution view and the simulation become one interactive object. Prototype merged-vs-split and judge which is clearer. For the contribution encoding itself, prototype ranked-bar vs. waterfall vs. stacked-area (§4).

### Rates
- **Existed:** two stacked line charts (policy/bank/CORRA; bond yields 2/5/10yr).
- **Critique:** fine, but disconnected from the inflation story it exists to contextualize.
- **Explore:** consider tying rates *to* the CPI narrative (e.g. an overlay or adjacency showing "inflation vs. the Bank's response"), and annotating rate-decision dates. Keep it simple, but make it mean something next to the CPI.

### About / help
- **Existed:** an About tab + FAQ in `sweetAlert` modal popups.
- **Critique:** modals for reference content are hostile — you can't scan, link, or search them.
- **Explore:** inline, linkable explanations (contextual "what's this?" affordances next to terms), plus a proper static About page. Definitions like YoY vs. MoM belong *near where the number appears*, not buried in a popup.

---

## 6. Charts (implementation)
- **Library:** **Observable Plot** (d3-native, no commercial license — unlike the original's Highcharts). Wrap it in a small Svelte action/`onMount` that renders Plot into an attached node and re-renders on prop change.
- **Consistency:** one shared Plot theme helper (colors, type, axis styling) so every chart matches regardless of type — important now that we're using *more* chart types than the original's line-everywhere.
- **Mind Plot's grain:** declarative-static, so hover tooltips use `tip` marks; **synced tooltips** across charts and **map-click → chart** are manual Svelte-state wiring. Budget for it on the interactive screens.
- **Export:** keep PNG + CSV export (Plot renders SVG — serialize for PNG, export the series for CSV).
- **Motion:** subtle enter transitions; respect `prefers-reduced-motion`.

---

## 7. Components (likely set — adjust to the chosen IA)
Start reusable, but let the IA decisions in §3–5 drive the list rather than pre-committing.
1. `StatCard` — the headline number (big tabular value, direction glyph + label, region, group). The single most reusable piece; make it bold.
2. `SeriesChart` — themed line/area wrapper (multi-series, smoothing, export).
3. `ContributionChart` — whichever encoding wins for "who's driving it" (bar/waterfall/area).
4. `SmallMultiples` — grid of sparklines for many-series-at-a-glance (new vs. original).
5. `GeoSelector` — map *and* a lightweight list/segmented fallback; use the map only where geography is the actual task.
6. `SegmentedControl` — ranges / YoY-MoM.
7. `GroupPicker` — toggle groups (drives the merged contribution/simulation surface).
8. `Explainer` — inline contextual "what's this?" (replaces modal FAQ).

---

## 8. Accessibility & polish
- Color never the only signal — pair with glyphs/labels, especially for inflation direction.
- Every chart needs a text/table fallback or an `aria` trend summary.
- ≥44px tap targets (mobile was absent in the original).
- Dark mode is easy with tokens — warm dark holds the identity well; prototype it.

---

## 9. Tone & the bar for "better"
Warm, Canadian, credible — human over terminal, but numerically serious. The test for any proposal: **does an anxious person understand their situation in 3 seconds, and can a curious person go deep without hitting a wall?** The original satisfied the second better than the first, and made everyone configure before seeing. "Better" means an answer-first experience that respects both audiences — and if a proposal here doesn't beat the original on that test, say so and try another.