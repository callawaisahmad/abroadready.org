#!/usr/bin/env python3
"""
build_blog.py — generate the static blog from data/blog.json:
  * pages/<slug>   one SEO-optimised static page per post
  * pages/blog     the blog index (static cards + JS filter/search)
  * sitemap.xml, robots.txt

Static HTML (content baked in) is used deliberately so search engines index the
full article text, with per-page <title>, meta description, canonical, Open
Graph, Twitter Card and JSON-LD (BlogPosting + FAQPage + BreadcrumbList).
"""
import json, os, re, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAIN = "https://abroadready.org"   # change to your real domain

MONTHS = {m: i+1 for i, m in enumerate(
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"])}

CAT_STYLE = {
    "Scholarship Guides":      ("🎓", "linear-gradient(135deg,#3b82f6,#8b5cf6)"),
    "Country Guides":          ("🌍", "linear-gradient(135deg,#10b981,#14b8a6)"),
    "SOP & Essays":            ("✍️", "linear-gradient(135deg,#f59e0b,#fbbf24)"),
    "Test Prep & Interviews":  ("📝", "linear-gradient(135deg,#8b5cf6,#6366f1)"),
    "Applications & Funding":  ("💰", "linear-gradient(135deg,#14b8a6,#0ea5e9)"),
    "Internships":             ("💼", "linear-gradient(135deg,#f97316,#ef4444)"),
    "Study Abroad":            ("✈️", "linear-gradient(135deg,#06b6d4,#3b82f6)"),
    "Opportunities":           ("🎯", "linear-gradient(135deg,#22c55e,#10b981)"),
}
def cat_style(c): return CAT_STYLE.get(c, ("📄", "linear-gradient(135deg,#3b82f6,#8b5cf6)"))

def iso_date(display):
    m = re.match(r"([A-Za-z]+)\s+(\d+),\s+(\d+)", display or "")
    if not m: return "2026-07-01"
    mon, day, yr = m.group(1)[:3], int(m.group(2)), int(m.group(3))
    return "%04d-%02d-%02d" % (yr, MONTHS.get(mon, 1), day)

def strip_tags(s): return re.sub(r"<[^>]+>", "", s or "").strip()

def esc(s): return html.escape(s or "", quote=True)

def head(post, canonical):
    emoji, _ = cat_style(post["category"])
    ld_article = {
        "@context": "https://schema.org", "@type": "BlogPosting",
        "headline": post["title"], "description": post["metaDescription"],
        "datePublished": iso_date(post["date"]), "dateModified": iso_date(post["date"]),
        "author": {"@type": "Organization", "name": "AbroadReady"},
        "publisher": {"@type": "Organization", "name": "AbroadReady"},
        "mainEntityOfPage": canonical, "articleSection": post["category"],
        "keywords": ", ".join(post.get("tags", [])),
    }
    ld_faq = {"@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": f["q"],
            "acceptedAnswer": {"@type": "Answer", "text": strip_tags(f["a"])}} for f in post.get("faq", [])]}
    ld_bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": DOMAIN + "/"},
        {"@type": "ListItem", "position": 2, "name": "Blog", "item": DOMAIN + "/pages/blog"},
        {"@type": "ListItem", "position": 3, "name": post["title"], "item": canonical}]}
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MDWR309ZKM"></script>
  <script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-MDWR309ZKM');
  </script>
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7542350506460545"
     crossorigin="anonymous"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(post['title'])} | AbroadReady</title>
  <meta name="description" content="{esc(post['metaDescription'])}">
  <meta name="keywords" content="{esc(', '.join(post.get('tags', [])))}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{esc(post['title'])}">
  <meta property="og:description" content="{esc(post['metaDescription'])}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{DOMAIN}/assets/blog/{post['slug']}.jpg">
  <meta property="og:site_name" content="AbroadReady">
  <meta name="twitter:image" content="{DOMAIN}/assets/blog/{post['slug']}.jpg">
  <meta property="article:section" content="{esc(post['category'])}">
  <meta property="article:published_time" content="{iso_date(post['date'])}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(post['title'])}">
  <meta name="twitter:description" content="{esc(post['metaDescription'])}">
  <link rel="stylesheet" href="../css/design-system.css">
  <link rel="stylesheet" href="../css/blog.css">
  <script type="application/ld+json">{json.dumps(ld_article, ensure_ascii=False)}</script>
  <script type="application/ld+json">{json.dumps(ld_faq, ensure_ascii=False)}</script>
  <script type="application/ld+json">{json.dumps(ld_bc, ensure_ascii=False)}</script>

  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#3b82f6">
</head>
<body>
<script src="../js/saved.js"></script>
"""

def faq_html(post):
    if not post.get("faq"): return ""
    items = "".join(
        f'<div class="faq-item"><div class="faq-q">{esc(f["q"])}<span class="faq-icon">+</span></div>'
        f'<div class="faq-a"><p>{f["a"]}</p></div></div>' for f in post["faq"])
    return f'<section class="article-faq"><h2>Frequently asked questions</h2>{items}</section>'

def related_html(post, posts):
    same = [p for p in posts if p["category"] == post["category"] and p["slug"] != post["slug"]]
    others = [p for p in posts if p["slug"] != post["slug"] and p not in same]
    picks = (same + others)[:3]
    cards = ""
    for p in picks:
        emoji, grad = cat_style(p["category"])
    cards += (f'<a class="post-card" href="{p["slug"]}">'
              f'<img class="post-thumb-img" src="../assets/blog/{p["slug"]}.jpg" alt="{esc(p["title"])}" loading="lazy" width="1200" height="630">'
              f'<div class="post-body"><span class="post-cat">{esc(p["category"])}</span>'
              f'<h3>{esc(p["title"])}</h3><p class="post-excerpt">{esc(p.get("excerpt",""))}</p>'
              f'<div class="post-meta"><span>{esc(p["date"])}</span><span>{p.get("readMins",8)} min read</span></div>'
              f'</div></a>')
    return f'<section class="related container"><h2>Related guides</h2><div class="blog-grid">{cards}</div></section>'

def prevnext_html(i, posts):
    prev = posts[i-1] if i > 0 else None
    nxt = posts[i+1] if i < len(posts)-1 else None
    left = (f'<a href="{prev["slug"]}"><div class="pn-label">← Previous</div>'
            f'<div class="pn-title">{esc(prev["title"])}</div></a>') if prev else '<span></span>'
    right = (f'<a class="next" href="{nxt["slug"]}"><div class="pn-label">Next →</div>'
             f'<div class="pn-title">{esc(nxt["title"])}</div></a>') if nxt else '<span></span>'
    return f'<nav class="prevnext">{left}{right}</nav>'

ARTICLE_SCRIPTS = """
<script>
document.addEventListener('DOMContentLoaded', function () {
  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () { q.parentElement.classList.toggle('open'); });
  });
  // Reading progress
  var bar = document.querySelector('.read-progress');
  window.addEventListener('scroll', function () {
    var h = document.documentElement, b = document.body;
    var st = h.scrollTop || b.scrollTop, sh = (h.scrollHeight || b.scrollHeight) - h.clientHeight;
    bar.style.width = (sh > 0 ? (st / sh * 100) : 0) + '%';
  });
  // Share
  document.querySelectorAll('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.getAttribute('data-share'), u = encodeURIComponent(location.href), ti = encodeURIComponent(document.title);
      var url = t === 'twitter' ? 'https://twitter.com/intent/tweet?url=' + u + '&text=' + ti
              : t === 'linkedin' ? 'https://www.linkedin.com/sharing/share-offsite/?url=' + u
              : t === 'facebook' ? 'https://www.facebook.com/sharer/sharer.php?u=' + u
              : '';
      if (t === 'copy') { navigator.clipboard && navigator.clipboard.writeText(location.href); btn.textContent = '✓'; setTimeout(function(){ btn.textContent='🔗'; }, 1500); return; }
      if (url) window.open(url, '_blank', 'width=600,height=500');
    });
  });
});
</script>
<script src="../js/components.js"></script>
</body>
</html>
"""

def article_page(post, i, posts):
    canonical = f"{DOMAIN}/pages/{post['slug']}"
    emoji, grad = cat_style(post["category"])
    cta = ('<div class="article-cta"><h3>Ready to find your scholarship?</h3>'
           '<p>Find fully funded scholarships with live deadlines, eligibility and apply links.</p>'
           '<a class="btn btn-lg" href="scholarships">Scholarships  →</a></div>')
    share = ('<div class="article-share"><span>Share:</span>'
             '<button class="share-btn" data-share="twitter" aria-label="Share on X">𝕏</button>'
             '<button class="share-btn" data-share="linkedin" aria-label="Share on LinkedIn">in</button>'
             '<button class="share-btn" data-share="facebook" aria-label="Share on Facebook">f</button>'
             '<button class="share-btn" data-share="copy" aria-label="Copy link">🔗</button></div>')
    return (head(post, canonical) +
        '<div class="read-progress"></div>' +
        '<article class="article-wrap">' +
        f'<nav class="breadcrumb"><a href="../">Home</a> › <a href="blog">Blog</a> › {esc(post["title"])}</nav>' +
        f'<img class="article-hero-img" src="../assets/blog/{post["slug"]}.jpg" alt="{esc(post["title"])}" loading="lazy" width="1200" height="630">' +
        f'<a class="article-cat" href="blog">{esc(post["category"])}</a>' +
        f'<h1 class="article-title">{esc(post["title"])}</h1>' +
        f'<div class="article-meta"><span>🗓️ {esc(post["date"])}</span><span>⏱️ {post.get("readMins",8)} min read</span><span>✍️ AbroadReady Team</span></div>' +
        f'<div class="article-body">{post["bodyHtml"]}</div>' +
        cta + share + faq_html(post) +
        '</article>' +
        related_html(post, posts) +
        prevnext_html(i, posts) +
        '<div style="height:var(--space-16)"></div>' +
        ARTICLE_SCRIPTS)

INDEX_SCRIPTS = """
<script>
document.addEventListener('DOMContentLoaded', function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.post-card'));
  var search = document.getElementById('blog-search-input');
  var empty = document.getElementById('blog-empty');
  var cat = 'all';
  function apply() {
    var q = (search.value || '').toLowerCase().trim();
    var shown = 0;
    cards.forEach(function (c) {
      var okCat = cat === 'all' || c.getAttribute('data-cat') === cat;
      var hay = (c.getAttribute('data-title') + ' ' + c.getAttribute('data-tags')).toLowerCase();
      var okQ = !q || hay.indexOf(q) !== -1;
      var show = okCat && okQ; c.style.display = show ? '' : 'none'; if (show) shown++;
    });
    empty.style.display = shown ? 'none' : 'block';
  }
  document.querySelectorAll('.blog-cat').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.blog-cat').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); cat = b.getAttribute('data-cat'); apply();
    });
  });
  search.addEventListener('input', apply);
});
</script>
<script src="../js/components.js"></script>
</body>
</html>
"""

def index_page(posts, cats):
    chips = '<button class="blog-cat active" data-cat="all">All Topics</button>' + \
        "".join(f'<button class="blog-cat" data-cat="{esc(c)}">{esc(c)}</button>' for c in cats)
    cards = ""
    for p in posts:
        emoji, grad = cat_style(p["category"])
        cards += (f'<a class="post-card" href="{p["slug"]}" data-cat="{esc(p["category"])}" '
                  f'data-title="{esc(p["title"])}" data-tags="{esc(" ".join(p.get("tags",[])))}">'
                  f'<img class="post-thumb-img" src="../assets/blog/{p["slug"]}.jpg" alt="{esc(p["title"])}" loading="lazy" width="1200" height="630">'
                  f'<div class="post-body"><span class="post-cat">{esc(p["category"])}</span>'
                  f'<h3>{esc(p["title"])}</h3><p class="post-excerpt">{esc(p.get("excerpt",""))}</p>'
                  f'<div class="post-meta"><span>{esc(p["date"])}</span><span>{p.get("readMins",8)} min read</span></div>'
                  f'</div></a>')
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MDWR309ZKM"></script>
  <script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-MDWR309ZKM');
  </script>
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7542350506460545"
     crossorigin="anonymous"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scholarship Blog & Study Abroad Guides | AbroadReady</title>
  <meta name="description" content="Expert guides on scholarships, SOPs, IELTS, interviews, internships and studying abroad. {len(posts)}+ in-depth articles to help you win fully funded scholarships.">
  <meta name="keywords" content="scholarship blog, study abroad guides, scholarship application tips, SOP writing, IELTS preparation, scholarship interview tips, internships abroad">
  <link rel="canonical" href="{DOMAIN}/pages/blog">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Scholarship Blog & Study Abroad Guides | AbroadReady">
  <meta property="og:description" content="Expert guides on scholarships, SOPs, IELTS, internships and studying abroad.">
  <meta property="og:url" content="{DOMAIN}/pages/blog">
  <meta property="og:image" content="{DOMAIN}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="AbroadReady - Find fully funded international scholarships">
  <meta property="og:site_name" content="AbroadReady">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Scholarship Blog & Study Abroad Guides">
  <meta name="twitter:description" content="Expert guides on winning fully funded scholarships, SOPs, IELTS, internships and studying abroad.">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "AbroadReady Scholarship Blog",
    "url": "{DOMAIN}/pages/blog",
    "description": "Expert scholarship guides - SOP writing, IELTS prep, interview tips, and more",
    "publisher": {{ "@type": "Organization", "name": "AbroadReady", "url": "{DOMAIN}" }},
    "breadcrumb": {{
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{ "@type": "ListItem", "position": 1, "name": "Home", "item": "{DOMAIN}/" }},
        {{ "@type": "ListItem", "position": 2, "name": "Blog", "item": "{DOMAIN}/pages/blog" }}
      ]
    }}
  }}
  </script>
  <link rel="stylesheet" href="../css/design-system.css">
  <link rel="stylesheet" href="../css/blog.css">

  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#3b82f6">
</head>
<body>
<script src="../js/saved.js"></script>
<section class="blog-index-hero">
  <div class="container text-center">
    <h1>Scholarship &amp; Study-Abroad Guides</h1>
    <p>In-depth, up-to-date guides on winning scholarships, writing standout applications, internships and studying abroad — {len(posts)} articles and counting.</p>
    <div class="blog-search">
      <input id="blog-search-input" type="text" placeholder="Search guides (e.g. Chevening, IELTS, SOP)…" autocomplete="off">
    </div>
  </div>
</section>
<section class="container section">
  <div class="blog-cats">{chips}</div>
  <div class="blog-grid" id="blog-grid">{cards}</div>
  <div class="blog-empty" id="blog-empty" style="display:none;"><div style="font-size:3rem;">🔍</div><h3>No guides match your search</h3><p>Try a different keyword or topic.</p></div>
</section>
{INDEX_SCRIPTS}"""

def sitemap(posts):
    static_pages = ["", "pages/scholarships", "pages/internships", "pages/saved", "pages/ai-advisor",
        "pages/sop-builder", "pages/success", "pages/blog", "pages/about",
        "pages/contact", "pages/privacy", "pages/terms",
        "pages/study", "pages/immigration", "pages/visa-guidance", "pages/admission-guidance",
        "pages/ielts-guidance", "pages/scholarship"]
    country_pages = [
        "pages/study-in-usa", "pages/immigrate-to-usa",
        "pages/study-in-canada", "pages/immigrate-to-canada",
        "pages/study-in-uk", "pages/immigrate-to-uk",
        "pages/study-in-germany", "pages/immigrate-to-germany",
        "pages/study-in-italy", "pages/immigrate-to-italy",
        "pages/study-in-france", "pages/immigrate-to-france",
        "pages/study-in-turkey", "pages/immigrate-to-turkey",
        "pages/study-in-australia", "pages/immigrate-to-australia",
        "pages/study-in-netherlands", "pages/immigrate-to-netherlands",
        "pages/study-in-sweden", "pages/immigrate-to-sweden",
        "pages/study-in-switzerland", "pages/immigrate-to-switzerland",
        "pages/study-in-spain", "pages/immigrate-to-spain",
        "pages/study-in-ireland", "pages/immigrate-to-ireland",
        "pages/study-in-new-zealand", "pages/immigrate-to-new-zealand",
    ]
    urls = "".join(f"  <url><loc>{DOMAIN}/{u}</loc><changefreq>weekly</changefreq></url>\n" for u in static_pages)
    urls += "".join(f"  <url><loc>{DOMAIN}/{u}</loc><changefreq>monthly</changefreq></url>\n" for u in country_pages)
    for p in posts:
        urls += f"  <url><loc>{DOMAIN}/pages/{p['slug']}</loc><lastmod>{iso_date(p['date'])}</lastmod><changefreq>monthly</changefreq></url>\n"
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n"

def main():
    with open(os.path.join(ROOT, "data", "blog.json"), encoding="utf-8") as fh:
        data = json.load(fh)
    posts, cats = data["posts"], data["categories"]
    pages_dir = os.path.join(ROOT, "pages")
    for i, post in enumerate(posts):
        with open(os.path.join(pages_dir, post["slug"] + ".html"), "w", encoding="utf-8") as fh:
            fh.write(article_page(post, i, posts))
    with open(os.path.join(pages_dir, "blog.html"), "w", encoding="utf-8") as fh:
        fh.write(index_page(posts, cats))
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write(sitemap(posts))
    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8") as fh:
        fh.write(_robots_txt(DOMAIN))
    print("Generated %d article pages + blog.html + sitemap.xml + robots.txt" % len(posts))


def _robots_txt(domain):
    ai_crawlers = [
        "gptbot", "chatgpt-user", "oai-searchbot",
        "claudebot", "anthropic-ai", "claude-web",
        "google-extended", "ccbot", "bytespider",
        "applebot-extended", "perplexitybot", "diffbot",
        "cohere-ai", "facebookbot", "amazonbot",
        "omgili", "omgilibot", "iaskspider", "youbot", "img2dataset",
    ]
    blocks = "".join("User-agent: %s\nAllow: /\n" % bot for bot in ai_crawlers)
    return "%sUser-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n" % (blocks, domain)


if __name__ == "__main__":
    main()
