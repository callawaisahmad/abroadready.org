#!/usr/bin/env python3
"""Merge the 6 agent blog batches into js/blog-data.js (window.BLOG_DATA)."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TR = "/root/.claude/projects/-home-claude/ce75f89c-ba7c-52e5-8067-44dd710fe8ec/tool-results"

DIRECT = [
    "/home/claude/posts.json",
    "/home/claude/out.json",
    "/home/claude/work/out.json",
]
WRAPPED = [
    os.path.join(TR, "toolu_01Jq9xMtFc9kUK3HxKjKeGfv.json"),
    os.path.join(TR, "toolu_01McPY7QnsAJ7G5PKGL6MPGe.json"),
    os.path.join(TR, "toolu_016RY8zk4aorbXUiytGfxF3K.json"),
]

def extract_posts_from_text(text):
    i = text.find('{"posts"')
    if i == -1:
        raise ValueError("no posts object")
    obj, _ = json.JSONDecoder().raw_decode(text[i:])
    return obj["posts"]

posts = []
for p in DIRECT:
    with open(p, encoding="utf-8") as fh:
        posts += json.load(fh)["posts"]
for p in WRAPPED:
    with open(p, encoding="utf-8") as fh:
        data = json.load(fh)
    text = data[0]["text"] if isinstance(data, list) else data.get("text", "")
    posts += extract_posts_from_text(text)

# De-dupe by slug, keep order
seen, uniq = set(), []
for post in posts:
    s = post.get("slug")
    if s and s not in seen:
        seen.add(s); uniq.append(post)

# Assign descending publication dates (weekly), newest first.
months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
# Start 2026-07-10 and step back 5 days each post.
y, m, d = 2026, 7, 10
def step_back(y, m, d, days):
    d -= days
    while d < 1:
        m -= 1
        if m < 1:
            m = 12; y -= 1
        # days in month (approx, fine for display)
        dim = [31,29 if y%4==0 else 28,31,30,31,30,31,31,30,31,30,31][m-1]
        d += dim
    return y, m, d

for i, post in enumerate(uniq):
    yy, mm, dd = step_back(y, m, d, i*5)
    post["date"] = "%s %d, %d" % (months[mm-1], dd, yy)
    post.setdefault("readMins", max(6, round(len(re.sub('<[^>]+>',' ',post.get('bodyHtml','')).split()) / 220)))

cats = []
for post in uniq:
    if post["category"] not in cats:
        cats.append(post["category"])

out = {"generatedNote": "Blog content for AbroadReady", "categories": cats, "posts": uniq}

dest = os.path.join(ROOT, "js", "blog-data.js")
with open(dest, "w", encoding="utf-8") as fh:
    fh.write("/* Auto-generated blog content. */\n")
    fh.write("window.BLOG_DATA = ")
    json.dump(out, fh, ensure_ascii=False)
    fh.write(";\n")

# Also write a plain JSON the static-site builder (build_blog.py) reads.
with open(os.path.join(ROOT, "data", "blog.json"), "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)

print("Merged %d posts into %s" % (len(uniq), dest))
print("Categories:", cats)
wc = sum(len(re.sub('<[^>]+>',' ',p.get('bodyHtml','')).split()) for p in uniq)
print("Total body words: %d (avg %d)" % (wc, wc//len(uniq)))
