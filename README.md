# AbroadReady — Scholarships Board

A scholarship discovery website: browse international scholarships, filter by
**programme, intake, region, field and funding**, then open any one to see its
**eligibility criteria, documents required, benefits, application fee, deadline
and official apply link** — plus a "before you apply" checklist.

Built as a set of plain HTML/CSS/JS files with a small Python data pipeline, so
it hosts **free** anywhere (GitHub Pages, Netlify, your own server) with no
backend or database.

---

## 1. Quick start

**Just look at it:** open `index.html` in your browser. The site ships with a
pre-built JavaScript copy of the data (`js/scholarships-data.js`), so it works
even by double-clicking — no server required.

**Run it properly (recommended for development):**

```bash
cd abroadready
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## 2. What's in the box

```
abroadready/
├── index.html                  Landing page (hero, live feed, 2-min quiz)
├── pages/
│   ├── results.html            ★ Filter + list page (Programme/Intake/Region/…)
│   ├── scholarship.html        ★ Detail page (eligibility, documents, apply)
│   ├── ai-advisor.html         (your existing pages, unchanged)
│   ├── sop-builder.html
│   ├── success.html · blog.html · partners.html
├── css/
│   ├── design-system.css       Shared design tokens (colours, buttons, cards)
│   ├── results.css             Filter/list styles
│   ├── scholarship.css         Detail-page styles
│   └── landing.css · tools.css
├── js/
│   ├── scholarships-data.js    Auto-generated data (loaded by the pages)
│   ├── scholarships.js         Shared engine (deadline math, status, helpers)
│   ├── components.js           Shared header + footer, injected on every page
│   ├── saved.js                Wishlist store (localStorage) + header badge
│   ├── landing.js              Homepage logic (feed + ticker + quiz)
│   └── raw/raw1..4.json        Curated source data (edit these to change content)
├── data/
│   └── scholarships.json       Auto-generated data (canonical JSON copy)
├── updater/
│   ├── build_data.py           Merges js/raw/*.json → data + js data file
│   ├── update_scholarships.py  Daily refresher (rebuild + link check + sources)
│   └── link_report.json        Generated report of any dead official links
└── .github/workflows/
    └── update-scholarships.yml  Free daily auto-refresh via GitHub Actions
```

★ = the two pages that deliver the core flow.

### Shared components (one place to edit the chrome)

The **header and footer are defined once** in `js/components.js` and injected into
every page at load. Change a nav link, the logo, the footer columns or the social
icons there and it updates across the whole site — no need to touch 13 files.
`updater/inject_components.py` is the helper that makes sure every page loads
`saved.js` + `components.js` (run it after adding a new page).

### Saved / wishlist

`js/saved.js` is a small localStorage-backed store. Tap the heart on any
scholarship (board cards or the detail page) to add it to your shortlist; the
header shows a live count and `pages/saved.html` lists everything you've saved.
No account needed — it lives in the browser.

---

## 3. The flow

1. **Landing → quiz.** The homepage 2-minute quiz collects programme level and
   destination and sends the visitor to the results page **pre-filtered**
   (e.g. `results.html?level=Masters&region=UK,Europe`).
2. **Results page.** Filter live by **Programme** (Bachelors / Masters / PhD /
   Postdoc), **Intake** (Fall / Spring / Summer / Rolling), **Region**, **Field
   of study**, **Funding**, plus "currently open only" and "free to apply only".
   Each card shows the flag, status (Open / Closing soon / Rolling), country,
   host university, level tags, funding, days-left deadline, and fee — with
   **View details** and a direct **Apply ↗** link.
3. **Detail page** (`scholarship.html?id=…`). Full eligibility criteria,
   documents required, benefits/perks, application fee (free or amount), a
   tickable **"before you apply"** checklist, intake, duration, competition, and
   the **official apply button** + full-info link.

---

## 4. Editing / adding scholarships

All content lives in `js/raw/raw1.json … raw4.json`. Each scholarship is one
object — copy an existing one and change the fields (see the schema in §6).
Then rebuild the site data:

```bash
python3 updater/build_data.py
```

That regenerates both `data/scholarships.json` and `js/scholarships-data.js`.
Refresh the browser and your change is live. (You can split scholarships across
as many `raw*.json` files as you like — they're all merged by `id`.)

---

## 5. "Auto-updated through the internet" — how it actually works

There is **no single free API** that returns every global scholarship, and
scraping hundreds of provider websites reliably needs ongoing maintenance. So
auto-update is delivered honestly, in three layers:

**Layer 1 — Live status (already on, no server).** The site recomputes
"Open / Closing soon / Rolling" and the **days-left counter** in the visitor's
browser on every page load, from each scholarship's annual deadline month. So
deadlines never silently go stale, even if nobody touches the data.

**Layer 2 — Scheduled refresh (free, automatic).** `updater/update_scholarships.py`
rebuilds the data, stamps a fresh timestamp, and **checks every official
apply/info link still responds** (writing `updater/link_report.json`). The
included GitHub Actions workflow runs it **daily** and commits any changes, so a
GitHub Pages site stays fresh with zero effort. Run it yourself any time:

```bash
python3 updater/update_scholarships.py            # full run with link check
python3 updater/update_scholarships.py --no-linkcheck
```

**Layer 3 — Extensible source adapters.** `fetch_from_sources()` in the updater
is where you plug in live feeds/APIs for specific providers (one small adapter
per source). A commented example is included. Anything an adapter returns is
merged into the dataset automatically on each run.

---

## 6. Data schema (one scholarship)

| Field | Meaning |
|---|---|
| `id` | unique slug, used in `scholarship.html?id=` |
| `name`, `provider` | title and funding organisation |
| `country`, `countryFlag`, `region` | location + emoji flag + region bucket |
| `hostUniversities` | where you'd study |
| `levels` | any of `Bachelors`, `Masters`, `PhD`, `Postdoc` |
| `fields` | subject areas (or `["All fields"]`) |
| `fundingType` | `Fully Funded` / `Partial` / `Tuition Only` / `Stipend Only` |
| `fundingSummary` | one-line what's covered |
| `benefits[]` | perks list |
| `eligibility[]` | eligibility criteria list |
| `documentsRequired[]` | documents list |
| `applicationFee` | `"Free"` or an amount |
| `deadlineMonth` / `deadlineNote` | annual deadline month + note |
| `intake` | typical intake term |
| `competition` | `Very High` / `High` / `Moderate` |
| `durationNote` | programme length |
| `thingsToHaveBeforeApply[]` | the "before you apply" checklist |
| `applyLink`, `infoLink` | official URLs |

`build_data.py` auto-adds `deadlineMonthNum`, `fieldTags`, and `isFree`.

---

## 7. Deploy free on GitHub Pages (with auto-refresh)

1. Create a GitHub repo and push this folder's contents.
2. **Settings → Pages →** Deploy from branch → `main` / root. Your site is live
   at `https://<you>.github.io/<repo>/`.
3. **Settings → Actions → General →** allow workflows to run and to write
   (Workflow permissions → *Read and write*).
4. The daily refresh (`.github/workflows/update-scholarships.yml`) now runs on
   its own; you can also trigger it from the **Actions** tab. Adjust the `cron:`
   line to change the schedule.

To use a custom domain like `abroadready.org`, add it under Settings → Pages and
point your DNS at GitHub.

---

## 8. Notes & disclaimers

- Deadlines shown are **typical annual windows**, recomputed to the next
  occurrence. Always confirm the **exact date** on the official apply link
  before applying — the UI says this on every card and detail page.
- All scholarship facts were compiled from official sources; verify current
  details on each provider's site, as programmes change year to year.
