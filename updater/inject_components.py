#!/usr/bin/env python3
"""
inject_components.py — ensure every page loads the shared saved.js + components.js
so the injected header/footer and wishlist work everywhere.

- For pages in pages/ the script src is ../js/...
- For index.html at the root it is js/...
- saved.js is inserted right after <body...> (so window.Saved exists before any
  page-level inline script at the bottom runs).
- components.js is inserted right before </body> (it self-defers to DOMContentLoaded).
Idempotent: running twice does not duplicate the tags.
"""
import os
import re
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def process(path, prefix):
    with open(path, "r", encoding="utf-8") as fh:
        html = fh.read()
    saved_tag = '<script src="%sjs/saved.js"></script>' % prefix
    comp_tag = '<script src="%sjs/components.js"></script>' % prefix

    changed = False

    # Insert saved.js right after the opening <body ...> tag if missing.
    if "js/saved.js" not in html:
        m = re.search(r"<body[^>]*>", html)
        if m:
            idx = m.end()
            html = html[:idx] + "\n" + saved_tag + html[idx:]
            changed = True

    # Insert components.js right before </body> if missing.
    if "js/components.js" not in html:
        idx = html.rfind("</body>")
        if idx != -1:
            html = html[:idx] + comp_tag + "\n" + html[idx:]
            changed = True

    if changed:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(html)
    return changed


def main():
    count = 0
    idx = os.path.join(ROOT, "index.html")
    if os.path.exists(idx) and process_root(idx):
        count += 1
    for p in glob.glob(os.path.join(ROOT, "pages", "*.html")):
        if process(p, "../"):
            count += 1
    print("Injected/updated %d files" % count)


def process_root(path):
    """index.html uses js/ (no ../)."""
    with open(path, "r", encoding="utf-8") as fh:
        html = fh.read()
    changed = False
    if "js/saved.js" not in html:
        m = re.search(r"<body[^>]*>", html)
        if m:
            idx = m.end()
            html = html[:idx] + '\n<script src="js/saved.js"></script>' + html[idx:]
            changed = True
    if "js/components.js" not in html:
        idx = html.rfind("</body>")
        if idx != -1:
            html = html[:idx] + '<script src="js/components.js"></script>\n' + html[idx:]
            changed = True
    if changed:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(html)
    return changed


if __name__ == "__main__":
    main()
