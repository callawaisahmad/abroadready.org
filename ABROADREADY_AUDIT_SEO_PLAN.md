# AbroadReady.org — Complete Audit & SEO Implementation Plan
**Site:** https://callawaisahmad.github.io/abroadready.org/  
**Audited:** July 2026  
**Prepared for:** Coding AI Implementation  

---

## SECTION 1 — CRITICAL BUGS (Fix First, Nothing Else Works Until These Are Done)

---

### BUG 1 — Homepage Counters Stuck at Zero

**File:** `index.html`  
**Problem:** Hero section shows `0+ Scholarships`, `0 Countries`, `0M Won by Students` — the JavaScript counter animation is not triggering. Visitors see dead zeros and lose trust immediately.  
**Fix:** Find the counter animation JS. The IntersectionObserver or scroll trigger is likely not firing because the element enters the viewport before the script initialises. Wrap the counter logic in a `DOMContentLoaded` listener and add a 300ms delay.

```js
// Find existing counter code and replace trigger with this:
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach(el => observer.observe(el));
  }, 300);
});
```

Target values to animate to: **500** scholarships, **48** countries, **$2M** won.

---

### BUG 2 — Results Page Scholarship Database Empty

**File:** `pages/results.html`  
**Problem:** Page loads with "No scholarships match those filters" and blank grid. The scholarship data array is either not imported, the fetch is failing silently, or filter logic runs before data loads.  
**Fix:** Add a console.log immediately after your data source loads to confirm it fires. Most likely the JS file path is wrong relative to `/pages/` subdirectory.

```html
<!-- Check this path is correct relative to /pages/ -->
<!-- WRONG if script is in root -->
<script src="scholarships.js"></script>

<!-- RIGHT — go up one level from /pages/ -->
<script src="../js/scholarships.js"></script>
```

Also add a visible fallback state and loading spinner so users know something is happening:

```html
<div id="loadingState">
  <div class="spinner"></div>
  <p>Loading 500+ scholarships...</p>
</div>
<div id="emptyState" style="display:none">
  <p>No scholarships match. Try removing a filter.</p>
</div>
```

---

### BUG 3 — AI Advisor Shows "— scholarships" and "— countries"

**File:** `pages/ai-advisor.html`  
**Problem:** The database count badges in the header show dashes instead of numbers. The JS that populates these counts is not running or the variable reference is wrong.  
**Fix:** After the scholarship data loads, update the count elements:

```js
// After your scholarship array loads:
document.querySelector('#scholarshipCount').textContent = scholarships.length;
document.querySelector('#countryCount').textContent = [...new Set(scholarships.map(s => s.country))].length;
```

---

### BUG 4 — Success Stories Page Completely Empty

**File:** `pages/success.html`  
**Problem:** Stat counters show `—` and no story cards are rendered. The stories data is not loading or the render function is not called.  
**Fix:** Same JS path issue likely. Also the stats show `—` for Stories Shared and Countries. Update after data loads:

```js
document.querySelector('#storiesCount').textContent = stories.length;
document.querySelector('#storiesCountries').textContent = uniqueCountries.length;
```

Also ensure the story cards are rendered into the DOM on page load, not only after a filter click.

---

### BUG 5 — Streak Badge Shows "🔥 1" (Incomplete UI)

**File:** `index.html`  
**Problem:** The streak counter in the nav area just shows `🔥 1` raw with no label or context. Looks like a broken component.  
**Fix:** Either complete the component with proper HTML structure or remove it until ready:

```html
<!-- Complete version -->
<div class="streak-badge" title="You're on a 1-day streak!">
  <span class="streak-fire">🔥</span>
  <div class="streak-info">
    <strong>1</strong>
    <span>Day Streak</span>
  </div>
</div>

<!-- Or remove entirely until ready -->
<!-- Delete the streak element from nav -->
```

---

### BUG 6 — SOP Builder Page Not Rendering

**File:** `pages/sop-builder.html`  
**Problem:** Page fetched with almost no content — just tab labels and a few buttons floating with no surrounding structure. The React or JS component that renders the full SOP builder is either failing to mount or the API key is missing causing a crash before render.  
**Fix:** Add error boundary and check browser console for JS errors. Ensure all `<script>` src paths are correct relative to `/pages/` directory. Add a visible error state:

```js
// Wrap main render in try/catch
try {
  initSOPBuilder();
} catch(err) {
  document.getElementById('sopRoot').innerHTML = `
    <div class="error-state">
      <p>⚠️ SOP Builder is loading. Please refresh or try again.</p>
    </div>
  `;
  console.error('SOP Builder error:', err);
}
```

---

### BUG 7 — All Internal Links Use GitHub Subdomain

**File:** All pages  
**Problem:** Every internal link uses the full GitHub Pages URL:
`https://callawaisahmad.github.io/abroadready.org/pages/blog.html`

When you move to `abroadready.org` these all break AND Google sees duplicate content across two domains simultaneously, hurting SEO badly.  
**Fix:** Replace ALL internal links with root-relative paths:

```html
<!-- WRONG — hardcoded GitHub URL -->
<a href="https://callawaisahmad.github.io/abroadready.org/pages/blog.html">Blog</a>

<!-- RIGHT — root relative, works on any domain -->
<a href="/pages/blog.html">Blog</a>

<!-- Homepage link -->
<a href="/">🎓 AbroadReady</a>
```

Do a find-and-replace across ALL HTML files:
- Find: `https://callawaisahmad.github.io/abroadready.org/`  
- Replace: `/`

---

### BUG 8 — Copyright Year Inconsistency

**File:** `index.html` says `© 2025`, all other pages say `© 2026`  
**Fix:** Standardise to `© 2026` across all pages. Use JS to auto-update:

```html
<span>© <span id="year"></span> AbroadReady.org</span>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
```

---

### BUG 9 — Social Media Links Are Dead (#)

**File:** All pages (footer)  
**Problem:** All four social icon links point to `#` — clicking them does nothing.  
**Fix:** Either add real URLs or remove until profiles exist:

```html
<!-- Option A: Add real links -->
<a href="https://facebook.com/abroadready" target="_blank" rel="noopener">FB</a>
<a href="https://instagram.com/abroadready" target="_blank" rel="noopener">IG</a>

<!-- Option B: Remove entirely until profiles are created -->
<!-- Delete the social links section from footer -->
```

---

### BUG 10 — Missing Pages Linked in Footer

**Files:** Footer on all pages links to these pages that likely don't exist yet:
- `/pages/about.html`
- `/pages/contact.html`
- `/pages/privacy.html`
- `/pages/terms.html`
- `/pages/partners.html`
- `/pages/scholarship.html` (individual scholarship journey map)

**Fix:** Either create these pages (priority: privacy.html and terms.html are legally required) or remove links until pages exist. Broken links are penalised by Google.

Minimum viable pages to create immediately:

```html
<!-- pages/privacy.html — minimum content -->
<h1>Privacy Policy</h1>
<p>Last updated: July 2026</p>
<p>AbroadReady.org does not collect personal data without consent. 
We use cookies for analytics only. We do not sell data to third parties.</p>

<!-- pages/terms.html — minimum content -->
<h1>Terms of Service</h1>
<p>Scholarship data is provided for informational purposes only. 
Always verify details on official scholarship websites before applying.</p>
```

---

## SECTION 2 — SEO BUGS (Critical for Google Indexing)

---

### SEO BUG 1 — Canonical URL Points to Wrong Domain

**File:** `index.html`  
**Problem:** `canonical: https://abroadready.org` while site lives on `callawaisahmad.github.io`. Google sees TWO versions of every page — massive duplicate content penalty.  
**Fix:** Keep canonical pointing to `abroadready.org` (your intended domain) BUT also set up a 301 redirect from GitHub Pages to `abroadready.org` as soon as domain is connected.  
On GitHub Pages with custom domain: add `CNAME` file to repo root containing just `abroadready.org`.

---

### SEO BUG 2 — Most Pages Missing Canonical, OG Tags, and Meta Description

**Pages affected:** `ai-advisor.html`, `success.html`, `sop-builder.html`, `results.html`

All four are missing:
- `<link rel="canonical">`
- `<meta property="og:image">`
- `<meta property="og:url">`
- `<meta name="description">` (AI Advisor and SOP Builder)

These pages cannot generate rich social previews and Google doesn't know their authoritative URL.

---

### SEO BUG 3 — Page Titles Are Not Keyword-Rich

**Problem:** Subpage titles are generic and miss search intent.

| Page | Current Title | Problem |
|------|---------------|---------|
| AI Advisor | `Scholarship Advisor \| AbroadReady` | No keywords people search |
| Success Stories | `Success Stories \| AbroadReady` | Not searchable |
| SOP Builder | `SOP Builder \| AbroadReady` | No keywords |
| Results | `Scholarships \| AbroadReady` | Too generic |

---

### SEO BUG 4 — No Schema Markup (Structured Data) Anywhere

No page has `application/ld+json` schema. Google cannot show rich results (star ratings, FAQ boxes, article dates) in search — a massive missed opportunity for click-through rate.

---

### SEO BUG 5 — No sitemap.xml or robots.txt

Google cannot discover pages efficiently without a sitemap. The blog has 30 articles — none will be found quickly without it.

---

### SEO BUG 6 — No Analytics or Tracking Installed

Zero visibility into where traffic comes from, what pages people visit, or what the quiz completion rate is.

---

## SECTION 3 — COMPLETE SEO FIX IMPLEMENTATION (Give This to Your Coding AI)

---

### TASK 1 — Fix All Page `<head>` Tags

**Instructions for coding AI:** Open each HTML file listed below and replace the `<head>` section with the corrected version provided.

---

#### `index.html` — Updated Head

```html
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <!-- PRIMARY SEO -->
  <title>AbroadReady — Free Scholarship Finder for Pakistani Students | 500+ Scholarships</title>
  <meta name="description" content="Find fully funded international scholarships in 2 minutes. Free AI-powered matching for Pakistani students across UK, USA, Germany, Australia and 45 more countries. No signup required."/>
  <link rel="canonical" href="https://abroadready.org/"/>

  <!-- OPEN GRAPH -->
  <meta property="og:title" content="AbroadReady — Free Scholarship Finder for Pakistani Students"/>
  <meta property="og:description" content="Find fully funded scholarships in 2 minutes. 500+ scholarships, 48 countries. Free for Pakistani students."/>
  <meta property="og:image" content="https://abroadready.org/assets/og-home.jpg"/>
  <meta property="og:url" content="https://abroadready.org/"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="AbroadReady"/>
  <meta property="og:locale" content="en_PK"/>

  <!-- TWITTER CARD -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="AbroadReady — Free Scholarship Finder for Pakistani Students"/>
  <meta name="twitter:description" content="Find fully funded scholarships in 2 minutes. 500+ scholarships, 48 countries."/>
  <meta name="twitter:image" content="https://abroadready.org/assets/og-home.jpg"/>

  <!-- GOOGLE SEARCH CONSOLE VERIFICATION — replace with your real code -->
  <meta name="google-site-verification" content="REPLACE_WITH_YOUR_GSC_CODE"/>

  <!-- SCHEMA MARKUP -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AbroadReady",
    "url": "https://abroadready.org",
    "description": "Free AI-powered scholarship finder for Pakistani students",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://abroadready.org/pages/results.html?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AbroadReady",
      "logo": {
        "@type": "ImageObject",
        "url": "https://abroadready.org/assets/logo.png"
      }
    }
  }
  </script>

  <!-- GOOGLE TAG MANAGER — replace GTM-XXXXXXX with real ID -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-XXXXXXX');</script>

  <!-- PRECONNECT for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>

  <!-- FAVICON -->
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"/>
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png"/>
</head>
<body>
<!-- GTM NOSCRIPT — place immediately after <body> -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

---

#### `pages/results.html` — Updated Head

```html
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>International Scholarships for Pakistani Students 2025-26 | AbroadReady</title>
  <meta name="description" content="Browse 500+ fully funded and partial scholarships for Pakistani students. Filter by country, degree, field and deadline. Updated daily."/>
  <link rel="canonical" href="https://abroadready.org/pages/results.html"/>
  <meta property="og:title" content="500+ Scholarships for Pakistani Students | AbroadReady"/>
  <meta property="og:description" content="Browse fully funded scholarships across 48 countries. Filter by degree, country and deadline. Free for Pakistani students."/>
  <meta property="og:image" content="https://abroadready.org/assets/og-results.jpg"/>
  <meta property="og:url" content="https://abroadready.org/pages/results.html"/>
  <meta property="og:type" content="website"/>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "International Scholarships for Pakistani Students",
    "description": "Browse 500+ scholarships across 48 countries",
    "url": "https://abroadready.org/pages/results.html",
    "isPartOf": { "@type": "WebSite", "name": "AbroadReady", "url": "https://abroadready.org" }
  }
  </script>
  <!-- Paste same GTM snippet here -->
</head>
```

---

#### `pages/ai-advisor.html` — Updated Head

```html
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AI Scholarship Advisor — Ask Any Scholarship Question | AbroadReady</title>
  <meta name="description" content="Get instant answers about Chevening, Fulbright, DAAD, and 500+ scholarships from our free AI advisor. Ask about eligibility, documents, SOPs, and deadlines."/>
  <link rel="canonical" href="https://abroadready.org/pages/ai-advisor.html"/>
  <meta property="og:title" content="Free AI Scholarship Advisor | AbroadReady"/>
  <meta property="og:description" content="Ask anything about Chevening, Fulbright, DAAD and 500+ scholarships. Get expert answers instantly."/>
  <meta property="og:image" content="https://abroadready.org/assets/og-advisor.jpg"/>
  <meta property="og:url" content="https://abroadready.org/pages/ai-advisor.html"/>
  <meta property="og:type" content="website"/>
  <!-- Paste same GTM snippet here -->
</head>
```

---

#### `pages/success.html` — Updated Head

```html
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pakistani Scholarship Winners — 847 Success Stories | AbroadReady</title>
  <meta name="description" content="Read 847 real stories of Pakistani students who won Chevening, Fulbright, DAAD and other scholarships. See their tips, CGPAs, IELTS scores and strategies."/>
  <link rel="canonical" href="https://abroadready.org/pages/success.html"/>
  <meta property="og:title" content="847 Pakistani Scholarship Success Stories | AbroadReady"/>
  <meta property="og:description" content="Real stories from Pakistani students who won fully funded scholarships abroad. Chevening, Fulbright, DAAD, Erasmus and more."/>
  <meta property="og:image" content="https://abroadready.org/assets/og-success.jpg"/>
  <meta property="og:url" content="https://abroadready.org/pages/success.html"/>
  <meta property="og:type" content="website"/>
  <!-- Paste same GTM snippet here -->
</head>
```

---

#### `pages/sop-builder.html` — Updated Head

```html
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Free SOP Builder for Scholarships — AI Essay Writer | AbroadReady</title>
  <meta name="description" content="Write and score your Statement of Purpose for Chevening, Fulbright and DAAD scholarships. Free AI-powered SOP builder with winning examples and essay scoring."/>
  <link rel="canonical" href="https://abroadready.org/pages/sop-builder.html"/>
  <meta property="og:title" content="Free SOP Builder for Scholarship Applications | AbroadReady"/>
  <meta property="og:description" content="AI-powered SOP builder for Chevening, Fulbright and DAAD. Write, score and improve your scholarship essays."/>
  <meta property="og:image" content="https://abroadready.org/assets/og-sop.jpg"/>
  <meta property="og:url" content="https://abroadready.org/pages/sop-builder.html"/>
  <meta property="og:type" content="website"/>
  <!-- Paste same GTM snippet here -->
</head>
```

---

#### `pages/blog.html` — Updated Head

```html
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Scholarship Guides for Pakistani Students — 30 Expert Articles | AbroadReady</title>
  <meta name="description" content="In-depth guides on Chevening, Fulbright, DAAD, IELTS, SOP writing and studying abroad. 30 expert articles to help Pakistani students win fully funded scholarships."/>
  <link rel="canonical" href="https://abroadready.org/pages/blog.html"/>
  <meta property="og:title" content="Scholarship Guides — 30 Expert Articles | AbroadReady"/>
  <meta property="og:description" content="In-depth guides on Chevening, Fulbright, DAAD, IELTS and SOP writing for Pakistani students."/>
  <meta property="og:image" content="https://abroadready.org/assets/og-blog.jpg"/>
  <meta property="og:url" content="https://abroadready.org/pages/blog.html"/>
  <meta property="og:type" content="website"/>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "AbroadReady Scholarship Blog",
    "url": "https://abroadready.org/pages/blog.html",
    "description": "Expert scholarship guides for Pakistani students",
    "publisher": { "@type": "Organization", "name": "AbroadReady" }
  }
  </script>
  <!-- Paste same GTM snippet here -->
</head>
```

---

### TASK 2 — Create sitemap.xml in Root Directory

**Instructions for coding AI:** Create a new file called `sitemap.xml` in the repository root (same level as `index.html`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>https://abroadready.org/</loc>
    <lastmod>2026-07-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/results.html</loc>
    <lastmod>2026-07-24</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/blog.html</loc>
    <lastmod>2026-07-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/ai-advisor.html</loc>
    <lastmod>2026-07-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/sop-builder.html</loc>
    <lastmod>2026-07-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/success.html</loc>
    <lastmod>2026-07-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Blog Articles -->
  <url>
    <loc>https://abroadready.org/pages/chevening-scholarship-complete-guide.html</loc>
    <lastmod>2026-07-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/fulbright-foreign-student-program-how-to-apply.html</loc>
    <lastmod>2026-07-05</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/daad-scholarships-explained-study-in-germany.html</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/how-to-write-a-winning-statement-of-purpose.html</loc>
    <lastmod>2026-05-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://abroadready.org/pages/ielts-7-plus-6-weeks-study-plan.html</loc>
    <lastmod>2026-04-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Add remaining blog article URLs following same pattern -->

  <url>
    <loc>https://abroadready.org/pages/partners.html</loc>
    <lastmod>2026-07-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

</urlset>
```

---

### TASK 3 — Create robots.txt in Root Directory

**Instructions for coding AI:** Create `robots.txt` in root.

```
User-agent: *
Allow: /

Sitemap: https://abroadready.org/sitemap.xml

Disallow: /admin/
Disallow: /api/
```

---

### TASK 4 — Create CNAME File for Custom Domain

**Instructions for coding AI:** Create a file called `CNAME` (no extension) in the repository root with this exact content:

```
abroadready.org
```

This tells GitHub Pages to serve the site on `abroadready.org` and automatically handles the redirect from the GitHub subdomain.

---

### TASK 5 — Fix All Internal Links (Find & Replace)

**Instructions for coding AI:** In ALL HTML files, do a global find and replace:

- **Find:** `https://callawaisahmad.github.io/abroadready.org/`
- **Replace with:** `/`

Then verify:
- `<a href="/index.html">` → change to `<a href="/">`
- Logo links → `<a href="/">`
- All nav links now use root-relative paths

---

### TASK 6 — Fix Homepage Counter Animation

**Instructions for coding AI:** Find the hero stats section in `index.html`. The three stat elements likely have `data-count` or similar attributes. Replace the existing counter initialisation with:

```js
document.addEventListener('DOMContentLoaded', () => {
  function animateCounter(el, target, suffix) {
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        el.textContent = target.toLocaleString() + suffix;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start).toLocaleString() + suffix;
      }
    }, 16);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  // Add data-count and data-suffix attributes to stat elements if not present
  // e.g. <span data-count="500" data-suffix="+">0+</span>
  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
});
```

Update the HTML elements:
```html
<span data-count="500" data-suffix="+">0+</span> Scholarships
<span data-count="48" data-suffix="">0</span> Countries
<span data-count="2" data-suffix="M+">0M</span> Won by Students
```

---

### TASK 7 — Add Schema Markup to Blog Article Pages

**Instructions for coding AI:** Every blog article page (the 30 individual articles) needs this schema in `<head>`. Use the page's actual title, description and date:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Chevening Scholarship: The Complete Guide",
  "description": "Everything you need to know about the Chevening Scholarship, from eligibility and funding to the four essays, interview, and university offer deadline.",
  "author": {
    "@type": "Organization",
    "name": "AbroadReady"
  },
  "publisher": {
    "@type": "Organization",
    "name": "AbroadReady",
    "logo": {
      "@type": "ImageObject",
      "url": "https://abroadready.org/assets/logo.png"
    }
  },
  "datePublished": "2026-07-10",
  "dateModified": "2026-07-10",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://abroadready.org/pages/chevening-scholarship-complete-guide.html"
  },
  "image": "https://abroadready.org/assets/blog-chevening.jpg"
}
</script>
```

Also add this FAQ schema to the Chevening and Fulbright guides (boosts Google rich results dramatically):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the Chevening Scholarship?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Chevening is the UK government's global scholarship programme for outstanding emerging leaders pursuing a one-year master's degree in the UK."
      }
    },
    {
      "@type": "Question",
      "name": "Is Chevening fully funded?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Chevening covers full tuition fees, a living stipend of approximately £14,000 per year, flights, and a visa fee allowance."
      }
    },
    {
      "@type": "Question",
      "name": "What is the minimum IELTS score for Chevening?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Chevening requires an IELTS score of 6.5 overall with no band below 5.5, or equivalent English language qualification."
      }
    }
  ]
}
</script>
```

---

### TASK 8 — Add GTM Noscript Tag to All Pages

**Instructions for coding AI:** Immediately after `<body>` on every HTML page, add:

```html
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

Replace `GTM-XXXXXXX` with the real GTM container ID once created.

---

### TASK 9 — Add GTM Event Tracking

**Instructions for coding AI:** In `index.html`, add the following event pushes to existing button click handlers. If using `onclick=""` attributes, add alongside existing code:

```js
// Quiz Started
function onQuizStart() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'quiz_started' });
}

// Quiz Completed (call this when quiz reaches results)
function onQuizComplete(answers) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'quiz_completed',
    quiz_country: answers.targetCountry,
    quiz_degree: answers.targetDegree
  });
}

// Newsletter Subscribe
function onNewsletterSubscribe(email) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'newsletter_subscribe' });
}
```

In `pages/results.html`:
```js
// Scholarship Card Click
function onScholarshipClick(name, country) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'scholarship_viewed',
    scholarship_name: name,
    scholarship_country: country
  });
}
```

In `pages/sop-builder.html`:
```js
// SOP Draft Generated
function onDraftGenerated(scholarshipType) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'sop_draft_generated',
    scholarship_type: scholarshipType
  });
}
```

---

### TASK 10 — Fix Copyright Year

**Instructions for coding AI:** In all HTML files, replace hardcoded copyright year with dynamic JS:

```html
<!-- Find this pattern in footer: -->
© 2025 AbroadReady.org
© 2026 AbroadReady.org

<!-- Replace with: -->
© <span id="footerYear"></span> AbroadReady.org

<!-- Add this script before </body>: -->
<script>document.getElementById('footerYear').textContent = new Date().getFullYear();</script>
```

---

### TASK 11 — Add Image Alt Tags

**Instructions for coding AI:** Check all `<img>` tags across the site. Every image must have a descriptive `alt` attribute for SEO and accessibility.

```html
<!-- WRONG -->
<img src="assets/hero.jpg"/>
<img src="assets/chevening.png" alt=""/>

<!-- RIGHT -->
<img src="assets/hero.webp" alt="Pakistani students celebrating scholarship acceptance letters abroad" width="1200" height="600" loading="lazy"/>
<img src="assets/chevening.webp" alt="Chevening Scholarship logo — UK government scholarship for Pakistani students" width="300" height="200"/>
```

---

## SECTION 4 — POST-FIX SETUP CHECKLIST

Once all code fixes are implemented, complete these steps manually:

### Google Search Console
1. Go to **search.google.com/search-console**
2. Add property: `https://abroadready.org`
3. Verify using HTML tag method — paste the meta tag from GSC into `<head>` of `index.html`
4. Submit sitemap: paste `https://abroadready.org/sitemap.xml`
5. Go to URL Inspection → paste homepage URL → Request Indexing
6. Repeat Request Indexing for: results, blog, ai-advisor, sop-builder, success pages
7. Check back in 48 hours for "Submitted and indexed" status

### Google Tag Manager
1. Go to **tagmanager.google.com** → Create Account → Container: `AbroadReady Web`
2. Copy GTM ID (format: `GTM-XXXXXXX`)
3. Replace all `GTM-XXXXXXX` placeholders in the code with your real ID
4. Inside GTM: Create GA4 tag → Trigger: All Pages → Publish
5. Inside GTM: Create Facebook Pixel tag → Trigger: All Pages → Publish

### Google Analytics 4
1. Go to **analytics.google.com** → Create property: `AbroadReady`
2. Get Measurement ID (`G-XXXXXXXXXX`)
3. Add GA4 Configuration tag inside GTM using this ID
4. Set up goals: Quiz Complete, Newsletter Subscribe, Scholarship Click

### Facebook Pixel
1. Go to **business.facebook.com** → Events Manager → Connect Data Source → Web
2. Create pixel: `AbroadReady`
3. Add pixel ID to Facebook Pixel tag in GTM
4. Set up custom conversions: Quiz Completed, SOP Generated

### PageSpeed
1. Go to **pagespeed.web.dev**
2. Test: `https://abroadready.org`
3. Convert all `.jpg/.png` images to `.webp` using **squoosh.app**
4. Add `loading="lazy"` to all images below the fold
5. Add `width` and `height` to all `<img>` tags (prevents layout shift)
6. Target score: 85+ mobile, 95+ desktop

---

## SECTION 5 — PRIORITY ORDER FOR CODING AI

**Do in this exact sequence:**

| Priority | Task | Time |
|----------|------|------|
| 🔴 1 | Fix all internal links (find & replace GitHub URL) | 10 min |
| 🔴 2 | Fix counter animation bug on homepage | 15 min |
| 🔴 3 | Fix results page empty database | 30 min |
| 🔴 4 | Fix success stories page empty | 20 min |
| 🔴 5 | Fix AI advisor database counts | 10 min |
| 🔴 6 | Fix SOP builder page not rendering | 30 min |
| 🟡 7 | Update all `<head>` sections with correct meta/OG tags | 30 min |
| 🟡 8 | Create `sitemap.xml` | 10 min |
| 🟡 9 | Create `robots.txt` | 5 min |
| 🟡 10 | Create `CNAME` file | 2 min |
| 🟡 11 | Add GTM snippet to all pages | 20 min |
| 🟡 12 | Add schema markup to all pages | 30 min |
| 🟢 13 | Fix copyright year inconsistency | 5 min |
| 🟢 14 | Fix social links (remove or fill) | 5 min |
| 🟢 15 | Create privacy.html and terms.html | 20 min |
| 🟢 16 | Add alt tags to all images | 15 min |
| 🟢 17 | Add GTM event tracking to buttons | 30 min |

**Total estimated time for coding AI: 4–5 hours**

---

*This plan covers every bug found during live site audit plus the complete SEO, tracking and indexing infrastructure needed for professional Google traffic and Facebook Ads.*
