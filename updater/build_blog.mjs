#!/usr/bin/env node
/*
 * build_blog.mjs — Node port of build_blog.py
 * Generates from data/blog.json:
 *   * pages/<slug>.html      one SEO-optimised static page per post
 *   * pages/blog.html        the blog index (static cards + JS filter/search)
 *   * sitemap.xml, robots.txt
 * Matches the live site structure: GA4 + AdSense + hero images + favicons +
 * og:image + JSON-LD (BlogPosting/FAQPage/BreadcrumbList) + correct CTA.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOMAIN = "https://abroadready.org";

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

const CAT_STYLE = {
  "Scholarship Guides": ["\u{1F393}", "linear-gradient(135deg,#3b82f6,#8b5cf6)"],
  "Country Guides": ["\u{1F30D}", "linear-gradient(135deg,#10b981,#14b8a6)"],
  "SOP & Essays": ["\u270D\uFE0F", "linear-gradient(135deg,#f59e0b,#fbbf24)"],
  "Test Prep & Interviews": ["\u{1F4DD}", "linear-gradient(135deg,#8b5cf6,#6366f1)"],
  "Applications & Funding": ["\u{1F4B0}", "linear-gradient(135deg,#14b8a6,#0ea5e9)"],
  "Internships": ["\u{1F4BC}", "linear-gradient(135deg,#f97316,#ef4444)"],
  "Study Abroad": ["\u2708\uFE0F", "linear-gradient(135deg,#06b6d4,#3b82f6)"],
  "Opportunities": ["\u{1F3AF}", "linear-gradient(135deg,#22c55e,#10b981)"],
};

function catStyle(c) {
  return CAT_STYLE[c] || ["\u{1F4C4}", "linear-gradient(135deg,#3b82f6,#8b5cf6)"];
}

function isoDate(display) {
  const m = /([A-Za-z]+)\s+(\d+),\s+(\d+)/.exec(display || "");
  if (!m) return "2026-07-01";
  const mon = (m[1] || "").slice(0, 3);
  const day = parseInt(m[2], 10);
  const yr = parseInt(m[3], 10);
  return `${yr}-${String(MONTHS[mon] || 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function stripTags(s) {
  return String(s || "").replace(/<[^>]+>/g, "").trim();
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const HEAD_EXTRA = `
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#3b82f6">
</head>`;

const SCRIPTS_TOP = `  <meta charset="UTF-8">

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MDWR309ZKM"></script>
  <script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-MDWR309ZKM');
  </script>
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7542350506460545"
     crossorigin="anonymous"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
`;

function head(post, canonical) {
  const ogImg = DOMAIN + "/assets/blog/" + post.slug + ".jpg";
  const ld_article = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: post.title, description: post.metaDescription,
    datePublished: isoDate(post.date), dateModified: isoDate(post.date),
    author: { "@type": "Organization", name: "AbroadReady" },
    publisher: { "@type": "Organization", name: "AbroadReady" },
    mainEntityOfPage: canonical, articleSection: post.category,
    keywords: (post.tags || []).join(", "),
  };
  const ld_faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: (post.faq || []).map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: stripTags(f.a) },
    })),
  };
  const ld_bc = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: DOMAIN + "/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: DOMAIN + "/pages/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: canonical },
    ],
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
${SCRIPTS_TOP}  <title>${esc(post.title)} | AbroadReady</title>
  <meta name="description" content="${esc(post.metaDescription)}">
  <meta name="keywords" content="${esc((post.tags || []).join(", "))}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(post.title)}">
  <meta property="og:description" content="${esc(post.metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImg}">
  <meta property="og:site_name" content="AbroadReady">
  <meta name="twitter:image" content="${ogImg}">
  <meta property="article:section" content="${esc(post.category)}">
  <meta property="article:published_time" content="${isoDate(post.date)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(post.title)}">
  <meta name="twitter:description" content="${esc(post.metaDescription)}">
  <link rel="stylesheet" href="../css/design-system.css">
  <link rel="stylesheet" href="../css/blog.css">
  <script type="application/ld+json">${JSON.stringify(ld_article)}</script>
  <script type="application/ld+json">${JSON.stringify(ld_faq)}</script>
  <script type="application/ld+json">${JSON.stringify(ld_bc)}</script>
${HEAD_EXTRA}
<body>
<script src="../js/saved.js"></script>
`;
}

function faqHtml(post) {
  if (!post.faq || !post.faq.length) return "";
  const items = post.faq.map((f) =>
    `<div class="faq-item"><div class="faq-q">${esc(f.q)}<span class="faq-icon">+</span></div>` +
    `<div class="faq-a"><p>${f.a}</p></div></div>`
  ).join("");
  return `<section class="article-faq"><h2>Frequently asked questions</h2>${items}</section>`;
}

function relatedHtml(post, posts) {
  const same = posts.filter((p) => p.category === post.category && p.slug !== post.slug);
  const others = posts.filter((p) => p.slug !== post.slug && !same.includes(p));
  const picks = same.concat(others).slice(0, 3);
  const cards = picks.map((p) => {
    const [, grad] = catStyle(p.category);
    return `<a class="post-card" href="${p.slug}">` +
      `<img class="post-thumb-img" src="../assets/blog/${p.slug}.jpg" alt="${esc(p.title)}" loading="lazy" width="1200" height="630">` +
      `<div class="post-body"><span class="post-cat">${esc(p.category)}</span>` +
      `<h3>${esc(p.title)}</h3><p class="post-excerpt">${esc(p.excerpt || "")}</p>` +
      `<div class="post-meta"><span>${esc(p.date)}</span><span>${p.readMins || 8} min read</span></div>` +
      `</div></a>`;
  }).join("");
  return `<section class="related container"><h2>Related guides</h2><div class="blog-grid">${cards}</div></section>`;
}

function prevnextHtml(i, posts) {
  const prev = i > 0 ? posts[i - 1] : null;
  const nxt = i < posts.length - 1 ? posts[i + 1] : null;
  const left = prev
    ? `<a href="${prev.slug}"><div class="pn-label">\u2190 Previous</div><div class="pn-title">${esc(prev.title)}</div></a>`
    : "<span></span>";
  const right = nxt
    ? `<a class="next" href="${nxt.slug}"><div class="pn-label">Next \u2192</div><div class="pn-title">${esc(nxt.title)}</div></a>`
    : "<span></span>";
  return `<nav class="prevnext">${left}${right}</nav>`;
}

const ARTICLE_SCRIPTS = `
<script>
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () { q.parentElement.classList.toggle('open'); });
  });
  var bar = document.querySelector('.read-progress');
  window.addEventListener('scroll', function () {
    var h = document.documentElement, b = document.body;
    var st = h.scrollTop || b.scrollTop, sh = (h.scrollHeight || b.scrollHeight) - h.clientHeight;
    bar.style.width = (sh > 0 ? (st / sh * 100) : 0) + '%';
  });
  document.querySelectorAll('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.getAttribute('data-share'), u = encodeURIComponent(location.href), ti = encodeURIComponent(document.title);
      var url = t === 'twitter' ? 'https://twitter.com/intent/tweet?url=' + u + '&text=' + ti
              : t === 'linkedin' ? 'https://www.linkedin.com/sharing/share-offsite/?url=' + u
              : t === 'facebook' ? 'https://www.facebook.com/sharer/sharer.php?u=' + u
              : '';
      if (t === 'copy') { navigator.clipboard && navigator.clipboard.writeText(location.href); btn.textContent = '\u2713'; setTimeout(function(){ btn.textContent='\u{1F517}'; }, 1500); return; }
      if (url) window.open(url, '_blank', 'width=600,height=500');
    });
  });
});
</script>
<script src="../js/components.js"></script>
</body>
</html>
`;

function articlePage(post, i, posts) {
  const canonical = `${DOMAIN}/pages/${post.slug}`;
  const cta = '<div class="article-cta"><h3>Ready to find your scholarship?</h3>' +
    '<p>Find fully funded scholarships with live deadlines, eligibility and apply links.</p>' +
    '<a class="btn btn-lg" href="scholarships">Scholarships \u2192</a></div>';
  const share = '<div class="article-share"><span>Share:</span>' +
    '<button class="share-btn" data-share="twitter" aria-label="Share on X">\u{1D54F}</button>' +
    '<button class="share-btn" data-share="linkedin" aria-label="Share on LinkedIn">in</button>' +
    '<button class="share-btn" data-share="facebook" aria-label="Share on Facebook">f</button>' +
    '<button class="share-btn" data-share="copy" aria-label="Copy link">\u{1F517}</button></div>';
  return head(post, canonical) +
    '<div class="read-progress"></div>' +
    '<article class="article-wrap">' +
    `<nav class="breadcrumb"><a href="../">Home</a> \u203A <a href="blog">Blog</a> \u203A ${esc(post.title)}</nav>` +
    `<img class="article-hero-img" src="../assets/blog/${post.slug}.jpg" alt="${esc(post.title)}" loading="lazy" width="1200" height="630">` +
    `<a class="article-cat" href="blog">${esc(post.category)}</a>` +
    `<h1 class="article-title">${esc(post.title)}</h1>` +
    `<div class="article-meta"><span>\u{1F5D3}\uFE0F ${esc(post.date)}</span><span>\u23F1\uFE0F ${post.readMins || 8} min read</span><span>\u270D\uFE0F AbroadReady Team</span></div>` +
    `<div class="article-body">${post.bodyHtml}</div>` +
    cta + share + faqHtml(post) +
    "</article>" +
    relatedHtml(post, posts) +
    prevnextHtml(i, posts) +
    '<div style="height:var(--space-16)"></div>' +
    ARTICLE_SCRIPTS;
}

const INDEX_SCRIPTS = `
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
`;

function indexPage(posts, cats) {
  const chips = '<button class="blog-cat active" data-cat="all">All Topics</button>' +
    cats.map((c) => `<button class="blog-cat" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
  const cards = posts.map((p) => {
    const [, grad] = catStyle(p.category);
    return `<a class="post-card" href="${p.slug}" data-cat="${esc(p.category)}" ` +
      `data-title="${esc(p.title)}" data-tags="${esc((p.tags || []).join(" "))}">` +
      `<img class="post-thumb-img" src="../assets/blog/${p.slug}.jpg" alt="${esc(p.title)}" loading="lazy" width="1200" height="630">` +
      `<div class="post-body"><span class="post-cat">${esc(p.category)}</span>` +
      `<h3>${esc(p.title)}</h3><p class="post-excerpt">${esc(p.excerpt || "")}</p>` +
      `<div class="post-meta"><span>${esc(p.date)}</span><span>${p.readMins || 8} min read</span></div>` +
      `</div></a>`;
  }).join("");
  const n = posts.length;
  return `<!DOCTYPE html>
<html lang="en">
<head>
${SCRIPTS_TOP}  <title>Scholarship Blog & Study Abroad Guides | AbroadReady</title>
  <meta name="description" content="Expert guides on scholarships, SOPs, IELTS, interviews, internships and studying abroad. ${n}+ in-depth articles to help you win fully funded scholarships.">
  <meta name="keywords" content="scholarship blog, study abroad guides, scholarship application tips, SOP writing, IELTS preparation, scholarship interview tips, internships abroad">
  <link rel="canonical" href="${DOMAIN}/pages/blog">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Scholarship Blog & Study Abroad Guides | AbroadReady">
  <meta property="og:description" content="Expert guides on scholarships, SOPs, IELTS, internships and studying abroad.">
  <meta property="og:url" content="${DOMAIN}/pages/blog">
  <meta property="og:image" content="${DOMAIN}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="AbroadReady - Find fully funded international scholarships">
  <meta property="og:site_name" content="AbroadReady">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Scholarship Blog & Study Abroad Guides">
  <meta name="twitter:description" content="Expert guides on winning fully funded scholarships, SOPs, IELTS, interviews, internships and studying abroad.">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "AbroadReady Scholarship Blog",
    "url": "${DOMAIN}/pages/blog",
    "description": "Expert scholarship guides - SOP writing, IELTS prep, interview tips, and more",
    "publisher": { "@type": "Organization", "name": "AbroadReady", "url": "${DOMAIN}" },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "${DOMAIN}/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "${DOMAIN}/pages/blog" }
      ]
    }
  }
  </script>
  <link rel="stylesheet" href="../css/design-system.css">
  <link rel="stylesheet" href="../css/blog.css">
${HEAD_EXTRA}
<body>
<script src="../js/saved.js"></script>
<section class="blog-index-hero">
  <div class="container text-center">
    <h1>Scholarship &amp; Study-Abroad Guides</h1>
    <p>In-depth, up-to-date guides on winning scholarships, writing standout applications, internships and studying abroad \u2014 ${n} articles and counting.</p>
    <div class="blog-search">
      <input id="blog-search-input" type="text" placeholder="Search guides (e.g. Chevening, IELTS, SOP)\u2026" autocomplete="off">
    </div>
  </div>
</section>
<section class="container section">
  <div class="blog-cats">${chips}</div>
  <div class="blog-grid" id="blog-grid">${cards}</div>
  <div class="blog-empty" id="blog-empty" style="display:none;"><div style="font-size:3rem;">\u{1F50D}</div><h3>No guides match your search</h3><p>Try a different keyword or topic.</p></div>
</section>
${INDEX_SCRIPTS}`;
}

function sitemap(posts) {
  const static_pages = [
    "", "pages/scholarships", "pages/internships", "pages/saved", "pages/ai-advisor",
    "pages/sop-builder", "pages/success", "pages/blog", "pages/about",
    "pages/contact", "pages/privacy", "pages/terms",
    "pages/study", "pages/immigration", "pages/visa-guidance", "pages/admission-guidance",
    "pages/ielts-guidance", "pages/scholarship",
  ];
  const country_pages = [
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
  ];
  let urls = static_pages.map((u) => `  <url><loc>${DOMAIN}/${u}</loc><changefreq>weekly</changefreq></url>\n`).join("");
  urls += country_pages.map((u) => `  <url><loc>${DOMAIN}/${u}</loc><changefreq>monthly</changefreq></url>\n`).join("");
  for (const p of posts) {
    urls += `  <url><loc>${DOMAIN}/pages/${p.slug}</loc><lastmod>${isoDate(p.date)}</lastmod><changefreq>monthly</changefreq></url>\n`;
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n";
}

function main() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "blog.json"), "utf8"));
  const posts = data.posts;
  const cats = data.categories;
  const pagesDir = path.join(ROOT, "pages");
  posts.forEach((post, i) => {
    fs.writeFileSync(path.join(pagesDir, post.slug + ".html"), articlePage(post, i, posts));
  });
  fs.writeFileSync(path.join(pagesDir, "blog.html"), indexPage(posts, cats));
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap(posts));
  fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml\n`);
  console.log(`Generated ${posts.length} article pages + blog.html + sitemap.xml + robots.txt`);
}

main();
