#!/usr/bin/env python3
"""
update_scholarships.py — AbroadReady automated data refresher
=============================================================

WHAT THIS DOES (the honest version of "auto-updated through the internet")

There is no single free API that returns every global scholarship, and scraping
hundreds of provider sites reliably needs ongoing maintenance. So "auto-update"
is delivered in three layers:

  LAYER 1 — Live status (no server needed).
    The website itself recomputes "Open / Closing soon / Rolling" and the
    days-left counter in the visitor's browser on every page load, using each
    scholarship's annual deadline month. Deadlines therefore never go stale.

  LAYER 2 — Scheduled refresh (this script + GitHub Actions).
    Run on a daily cron, this script:
      * rebuilds data/scholarships.json from the source files,
      * stamps a fresh generatedAt timestamp,
      * checks that every official apply/info link still responds, and writes
        updater/link_report.json so you can see any dead links,
      * (optionally) pulls new/updated entries from the SOURCES adapters below.

  LAYER 3 — Extensible source adapters.
    Add a function per provider/feed under `fetch_from_sources()` to bring in
    fresh entries automatically. One example adapter is included and disabled.

Run locally:   python3 updater/update_scholarships.py
Skip link check (faster/offline):  python3 updater/update_scholarships.py --no-linkcheck
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data", "scholarships.json")
REPORT = os.path.join(HERE, "link_report.json")

# Import the merge/enrich builder so a refresh always starts from the raw files.
sys.path.insert(0, HERE)
import build_data  # noqa: E402


# --------------------------------------------------------------------------- #
# LAYER 3 — source adapters (extend me)
# --------------------------------------------------------------------------- #
def fetch_from_sources():
    """Return a list of scholarship dicts pulled live from external sources.

    Each provider needs its own small adapter because there is no universal
    scholarship API. Add one function per source and append its results here.
    Anything returned is merged into the dataset by id (new ids are added,
    existing ids are refreshed). Return [] to rely only on the curated data.

    Example skeleton (left disabled — enable and adapt when you have a source):

        def _example_rss_adapter():
            url = "https://example.org/scholarships/feed.json"
            with urllib.request.urlopen(url, timeout=20) as r:
                raw = json.load(r)
            out = []
            for item in raw.get("items", []):
                out.append({
                    "id": item["slug"],
                    "name": item["title"],
                    "provider": item.get("org", ""),
                    "country": item.get("country", ""),
                    "countryFlag": "🎓",
                    "region": item.get("region", "Global"),
                    "levels": item.get("levels", ["Masters"]),
                    "fields": item.get("fields", ["All fields"]),
                    "fundingType": item.get("funding", "Partial"),
                    "fundingSummary": item.get("summary", ""),
                    "benefits": item.get("benefits", []),
                    "eligibility": item.get("eligibility", []),
                    "documentsRequired": item.get("documents", []),
                    "applicationFee": item.get("fee", "Free"),
                    "deadlineMonth": item.get("deadline_month"),
                    "deadlineNote": item.get("deadline_note", ""),
                    "intake": item.get("intake", ""),
                    "competition": item.get("competition", "High"),
                    "durationNote": item.get("duration", ""),
                    "thingsToHaveBeforeApply": item.get("before", []),
                    "applyLink": item["apply_url"],
                    "infoLink": item.get("info_url", item["apply_url"]),
                })
            return out

        return _example_rss_adapter()
    """
    return []


# --------------------------------------------------------------------------- #
# LAYER 2 — link validation
# --------------------------------------------------------------------------- #
def check_link(url, timeout=15):
    if not url:
        return {"url": url, "ok": False, "status": "empty"}
    req = urllib.request.Request(url, method="GET", headers={
        "User-Agent": "Mozilla/5.0 (compatible; AbroadReadyBot/1.0; +https://abroadready.org)"
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return {"url": url, "ok": 200 <= resp.status < 400, "status": resp.status}
    except urllib.error.HTTPError as e:
        # Many sites block bots with 403 but are actually fine for humans.
        ok = e.code in (403, 405, 429, 999)
        return {"url": url, "ok": ok, "status": e.code}
    except Exception as e:  # timeouts, DNS, SSL, etc.
        return {"url": url, "ok": False, "status": type(e).__name__}


def run_link_check(scholarships):
    seen, results = set(), []
    for s in scholarships:
        for field in ("applyLink", "infoLink"):
            url = s.get(field)
            if not url or url in seen:
                continue
            seen.add(url)
            r = check_link(url)
            r["scholarship"] = s["id"]
            r["field"] = field
            results.append(r)
    broken = [r for r in results if not r["ok"]]
    report = {
        "checkedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totalLinks": len(results),
        "brokenCount": len(broken),
        "broken": broken,
        "all": results,
    }
    with open(REPORT, "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)
    return report


# --------------------------------------------------------------------------- #
def merge_external(scholarships, external):
    if not external:
        return scholarships
    by_id = {s["id"]: s for s in scholarships}
    for e in external:
        by_id[e["id"]] = {**by_id.get(e["id"], {}), **e}
    return list(by_id.values())


def main():
    ap = argparse.ArgumentParser(description="Refresh AbroadReady scholarship data.")
    ap.add_argument("--no-linkcheck", action="store_true", help="Skip validating official links.")
    args = ap.parse_args()

    print("→ Rebuilding data from source files…")
    build_data.main()

    with open(DATA, "r", encoding="utf-8") as fh:
        payload = json.load(fh)
    scholarships = payload["scholarships"]

    print("→ Pulling from external source adapters (Layer 3)…")
    external = fetch_from_sources()
    if external:
        scholarships = merge_external(scholarships, external)
        # Re-run the enrichment so merged entries get computed fields too.
        # (Simplest robust approach: write merged raw and rebuild is overkill here;
        #  external adapters should already return fully-formed records.)
        payload["scholarships"] = scholarships
        payload["meta"]["count"] = len(scholarships)
        print(f"   merged {len(external)} external entries → {len(scholarships)} total")
    else:
        print("   no external adapters enabled (curated dataset only)")

    payload["meta"]["generatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(DATA, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)

    # Keep the JS mirror in sync for file:// / no-server usage.
    with open(os.path.join(ROOT, "js", "scholarships-data.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Auto-generated by updater/update_scholarships.py — do not edit by hand. */\n")
        fh.write("window.SCHOLARSHIP_DATA = ")
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write(";\n")

    if args.no_linkcheck:
        print("→ Skipping link check (--no-linkcheck).")
    else:
        print("→ Validating official apply/info links…")
        report = run_link_check(scholarships)
        print(f"   checked {report['totalLinks']} links, {report['brokenCount']} need review "
              f"(see updater/link_report.json)")

    print(f"✓ Done. {len(scholarships)} scholarships, stamped {payload['meta']['generatedAt']}.")


if __name__ == "__main__":
    main()
