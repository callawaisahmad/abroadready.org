# Project Rules

## Build version bump (MANDATORY — every commit + push)
- Before EVERY commit and push, bump the build number and timestamp.
- File: `data/version.json`
  - `build`: increment the integer by 1 (current value is the last build).
  - `date`: set to the current **Pakistan time (PKT, UTC+5, no DST)** in ISO format, e.g. `2026-08-03T15:32:56Z` (the Z suffix marks it as UTC; subtract 5h from PKT when writing). Include this file in the commit.
- The site footer renders this automatically from `js/components.js` as:
  `Build #N · Last updated: 3 Aug 2026, 15:32 PKT`
- Do NOT push without bumping the build first.

## Verification
- After edits: run `node --check` on any changed JS, and check HTML tag balance for edited HTML files.
- No Python available; use PowerShell/Node.
