# Project Rules

## Build version bump (MANDATORY — every commit + push)
- Before EVERY commit and push, bump the build number and timestamp.
- File: `data/version.json`
  - `build`: increment the integer by 1 (current value is the last build).
  - `date`: set to the current **Pakistan time (PKT, UTC+5, no DST)** in ISO format, e.g. `2026-08-03T15:32:56Z` (the Z suffix marks it as UTC; subtract 5h from PKT when writing). Include this file in the commit.
- The site footer renders this automatically from `js/components.js` as:
  `Build #N · Last updated: 3 Aug 2026, 15:32 PKT`
- Do NOT push without bumping the build first.

## Content strategy (October 2026 — short-form month)
- Write SHORT, precise, high-CTR posts for the next month. Target ~900-1,300 visible words (never above ~1,500).
- Purpose: faster CTR, quick answers, easier scanning for the audience.
- Structure per short post:
  - Open with the direct answer in the first paragraph (the keyword phrase + the answer within the first 30 words).
  - Short heading formula: question-form H2s only where someone literally searches that question; otherwise keyword-rich descriptive headings.
  - Paragraphs 1-3 sentences, max ~60 words, one idea each.
  - 1 inline figure (`article-inline-img`) required; 1 table ONLY where it genuinely helps (deadlines, comparisons); drop table if it adds nothing.
  - 3-5 H2s max; one H2 must contain the focus keyword verbatim.
  - FAQ: optional, keep to 1-3 quick question/answer pairs.
  - 3+ internal links, 1-2 external links (authoritative).
- Focus keywords are umbrella/unambiguous phrases; do NOT stuff step-numbers.
- Mark short posts in `data/blog.json` with `"format": "short"` so the SEO audit applies the short gate (900-1,300 words, figure required, table optional) instead of the long-form gate.
- Existing long-form posts (no `format` field) keep the long gate (>=4,500 words, table + figure required, FAQ >=3).
- Release gate is still 0/0 on `%TEMP%\opencode\full-seo-audit.js` before every push.

## Verification
- After edits: run `node --check` on any changed JS, and check HTML tag balance for edited HTML files.
- No Python available; use PowerShell/Node.
