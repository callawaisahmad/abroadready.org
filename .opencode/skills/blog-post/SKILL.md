---
name: Blog Post
description: Draft, format, and ship an AbroadReady blog post. Use when writing a new post, editing data/blog.json, creating pages/<slug>.html, or preparing a content commit/push that must pass the SEO release gate.
---

# AbroadReady Blog Post

Use this skill for any work that adds or edits a blog article on AbroadReady.

## Before you write

1. Read `AGENTS.md` — it holds the current content strategy and the mandatory build-bump rule. Strategy changes over time, so treat it as the source of truth over this file.
2. Read `references/post-schema.md` for the exact `data/blog.json` post shape and the short vs long gates.
3. Ask the user for: `slug`, target `focusKeyword`, and `format` (`short` or `long`). If unstated, default to `short` per the October 2026 strategy.

## Pick the format and obey its gate

| | Short (`"format": "short"`) | Long (no `format` field) |
| --- | --- | --- |
| Words (visible) | 900–1,300 | ≥ 4,500 |
| Inline figure | Required | Required |
| Table | Optional | Required |
| FAQ pairs | 0–3 | ≥ 3 |
| H2s | 3–5, one containing the focus keyword verbatim | — |

Never let a short post exceed ~1,500 visible words.

## Write it

- Open with the direct answer: focus keyword + answer inside the first 30 words.
- Paragraphs 1–3 sentences, one idea each, ~60 words max.
- Use question-form H2s only when a user would literally search that question.
- Focus keywords are umbrella phrases. Do **not** stuff step numbers.
- Links: 3+ internal, 1–2 external (authoritative, with `target="_blank" rel="noopener nofollow"`).
- One inline figure: `<figure class="article-inline-img">` pointing at `../assets/blog/<slug>-inline.jpg`.

## Wire it in

1. Add the post object to the `posts` array in `data/blog.json`. Field order in existing files varies; match the surrounding style.
2. Add the inline image under `assets/blog/<slug>-inline.jpg`.
3. Generate the pages from `data/blog.json`:

   ```sh
   node updater/build_blog.mjs
   ```

   This regenerates every article page plus `blog.html`, `sitemap.xml`, `robots.txt` and `llms.txt`.

**Never hand-edit `pages/<slug>.html`.** Those files are build output. The next
`build_blog.mjs` run re-emits them from `bodyHtml` and silently reverts any
direct edit, so a page-level fix to a link, heading or image looks correct until
the following build undoes it. Fix content in `data/blog.json` (or in the
builder) and regenerate. This has already caused one round of links pointing at
a retired noindex stub that reappeared on every rebuild.

## Ship it (release gate — 0/0 required)

Run from the repo root:

```sh
node tools/full-seo-audit.js
```

This must report **ERRORS = 0 and WARNINGS = 0**. INFO items are fine. Fix everything else before committing.

The gate checks more than metadata: internal links to noindex pages, duplicate titles, sitemap entries pointing at noindex pages, broken `<img src>`, oversized page images and unreferenced assets are all reported. A broken image or a link to a stub is an ERROR, so run it after regenerating pages, not before.

Then bump the build (mandatory before every commit + push):

- Edit `data/version.json`: increment `build` by 1.
- Set `date` to the current time in ISO form with a `Z` suffix, e.g. `2026-08-03T15:32:56Z`. The `Z` marks it as UTC, so subtract 5h from the Pakistan clock time (PKT is UTC+5, no DST). `js/components.js` reads this file at runtime and renders the footer as `Build #N · Last updated: … PKT`.

## Verify before committing

- `node --check` on any changed JS.
- Tag balance on edited HTML: `node tools/check-html.mjs` (no arguments checks every page; pass file paths to check just those). It reports crossed tags too, not only mismatched counts.
- Re-run the gate after any regeneration — it checks links, images and titles, so a stale page can fail it.

## Loading this skill

Mention `@blog-post` in a prompt to load it explicitly, or let the model pick it from the description above.
