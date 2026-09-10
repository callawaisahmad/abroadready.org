#!/usr/bin/env node
/*
 * build_scholarships.mjs
 * Generates one SEO-optimised static page per scholarship:
 *   pages/scholarship-<id>.html   (unique title, H1, meta description,
 *                                 BreadcrumbList + FAQPage JSON-LD, rich body)
 * Also:
 *   * rewrites the <noscript> crawlable list in pages/scholarships.html (all 63)
 *   * rewrites legacy `scholarship?id=` links to the new static URLs
 *   * converts pages/scholarship.html into a noindex redirect page
 *   * appends scholarship-* URLs to sitemap.xml
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOMAIN = "https://abroadready.org";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cap(s, n) {
  const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trim().replace(/[,;\s]+$/, "") + "…";
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : String(v).split(",").map((x) => x.trim()).filter(Boolean);
}

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

const HEAD_EXTRA = `
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#3b82f6">
</head>`;

const COUNTRY_SLUG = {
  "united states": "usa", "united states of america": "usa", "us": "usa",
  "united kingdom": "uk", "great britain": "uk", "england": "uk",
  "turkiye": "turkey", "türkiye": "turkey", "turkey": "turkey",
  "south korea": "korea", "korea": "korea", "south korea (republic of korea)": "korea",
  "the netherlands": "netherlands", "netherlands": "netherlands",
  "new zealand": "new-zealand",
  "usa": "usa",
};

function countryToSlug(c) {
  const k = String(c || "").toLowerCase().replace(/[()]/g, "").trim();
  return (COUNTRY_SLUG[k] || k) .replace(/\s+/g, "-");
}

function metaDescription(s) {
  const levels = asArray(s.levels).join("/");
  const funding = (s.fundingType || "").toLowerCase();
  const head = cap(s.fundingSummary || `${s.name} — ${funding} ${(levels || "scholarship funding")} in ${s.country || "international"} scholarship.`, 105);
  const tail = (s.deadlineMonth ? ` Deadline: ${s.deadlineMonth}.` : "") + " See eligibility, required documents, and how to apply.";
  return cap((head + tail).replace(/\s+/g, " "), 158);
}

function titleFor(s) {
  let t = s.name;
  if (t.length > 46) t = t.slice(0, 46).trim().replace(/[,;-]+$/, "");
  return `${t} | AbroadReady`;
}

function factRow(label, value) {
  if (value == null || String(value).trim() === "") return "";
  return `<div class="fact-row"><span class="fact-label">${esc(label)}</span><span class="fact-value">${esc(value)}</span></div>`;
}

function faqItems(s) {
  const out = [
    { q: `Who is eligible for the ${s.name}?`, a: asArray(s.eligibility).join(" ") },
    { q: `What does the ${s.name} cover?`, a: asArray(s.benefits).join(" ") },
    { q: `What documents are required for the ${s.name}?`, a: asArray(s.documentsRequired).join(" ") },
  ];
  if (s.deadlineNote || s.deadlineMonth) out.push({ q: `When is the ${s.name} deadline?`, a: s.deadlineNote || `Applications are typically due in ${s.deadlineMonth}. Confirm the exact date on the official website.` });
  out.push({ q: `Does the ${s.name} have an application fee?`, a: s.isFree ? `No — applications for the ${s.name} are free.` : `Yes — the ${s.name} charges ${s.applicationFee || "a fee"}. Check the official website for the exact amount.` });
  return out;
}

function relatedPosts(s, posts) {
  const c = (s.country || "").toLowerCase();
  const nameTokens = (s.name || "").toLowerCase().split(/[^a-z]+/).filter((t) => t.length > 3);
  const scored = posts.map((p) => {
    const hay = (p.title + " " + p.slug + " " + (p.tags || []).join(" ")).toLowerCase();
    let sc = 0;
    if (c && (hay.includes(c) || hay.includes(countryToSlug(c)))) sc += 3;
    for (const t of nameTokens) if (hay.includes(t)) sc += 1;
    if ((p.category || "").toLowerCase().includes("scholarship")) sc += 1;
    return [sc, p];
  }).filter(([sc]) => sc > 1).sort((a, b) => b[0] - a[0]).map(([, p]) => p);
  const picks = scored.slice(0, 3);
  if (!picks.length) {
    picks.push(...posts.filter((p) => (p.category || "").toLowerCase() === "scholarship guides").slice(0, 3));
  }
  return picks.map((p) =>
    `<a class="related-card" href="../pages/${p.slug}"><strong>${esc(p.title)}</strong><p class="muted">${esc(cap(p.excerpt || "", 110))}</p></a>`
  ).join("");
}

function countryPageLink(s) {
  const slug = countryToSlug(s.country);
  const file = path.join(ROOT, "pages", `study-in-${slug}.html`);
  if (fs.existsSync(file)) {
    return `<a class="pill pill-blue" href="../pages/study-in-${slug}">🎓 Guide to studying in ${esc(s.country)} →</a>`;
  }
  return "";
}

function scholarshipPage(s, posts) {
  const canonical = `${DOMAIN}/pages/scholarship-${s.id}`;
  const levels = asArray(s.levels).join("/");
  const fields = asArray(s.fields).join(", ");
  const funding = s.fundingType || "";
  const desc = metaDescription(s);
  const title = titleFor(s);
  const faq = faqItems(s);

  const ld_web = {
    "@context": "https://schema.org", "@type": "WebPage",
    name: s.name, description: desc, url: canonical,
    provider: { "@type": "EducationalOrganization", name: s.provider },
    about: { "@type": "Thing", name: `${s.name} — ${funding} scholarship in ${s.country}` },
    publisher: { "@type": "Organization", name: "AbroadReady", url: DOMAIN },
  };
  const ld_bc = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: DOMAIN + "/" },
      { "@type": "ListItem", position: 2, name: "Scholarships", item: DOMAIN + "/pages/scholarships" },
      { "@type": "ListItem", position: 3, name: s.name, item: canonical },
    ],
  };
  const ld_faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: cap(f.a, 480) } })),
  };

  const body = `<!DOCTYPE html>
<html lang="en">
<head>
${SCRIPTS_TOP}  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${DOMAIN}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="AbroadReady">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${DOMAIN}/assets/og-image.png">
  <link rel="stylesheet" href="../css/design-system.css">
  <link rel="stylesheet" href="../css/scholarship.css">
  <script type="application/ld+json">${JSON.stringify(ld_web)}</script>
  <script type="application/ld+json">${JSON.stringify(ld_bc)}</script>
  <script type="application/ld+json">${JSON.stringify(ld_faq)}</script>
${HEAD_EXTRA}
<body>
<script src="../js/saved.js"></script>

<nav class="navbar glass-panel">
  <div class="container flex items-center justify-between">
    <a href="../" class="nav-logo">
      <span class="logo-icon">🎓</span>
      <span class="logo-text">Abroad<span class="text-gradient">Ready</span></span>
    </a>
    <div class="nav-actions flex items-center gap-4">
      <a href="../pages/scholarships" class="btn btn-ghost btn-sm">← All scholarships</a>
    </div>
  </div>
</nav>

<div class="sc-hero">
  <div class="container">
    <div class="sc-hero-card">
      <div class="sc-hero-top">
        <div>
          <h1>${esc(s.name)}</h1>
          <p class="sc-org">${esc(s.provider || "")} · ${s.countryFlag || ""} ${esc(s.country || "")}${s.region ? " · " + esc(s.region) : ""}</p>
        </div>
      </div>
      <div class="sc-quick-stats grid grid-4">
        <div class="stat-box"><span class="stat-label">Funding</span><span class="stat-val">${esc(funding)}</span></div>
        <div class="stat-box"><span class="stat-label">Level</span><span class="stat-val">${esc(levels)}</span></div>
        <div class="stat-box"><span class="stat-label">Deadline</span><span class="stat-val">${esc(s.deadlineMonth || s.deadlineNote || "Varies")}</span></div>
        <div class="stat-box"><span class="stat-label">Application fee</span><span class="stat-val">${esc(s.isFree ? "Free" : (s.applicationFee || "Varies"))}</span></div>
      </div>
    </div>
  </div>
</div>

<div class="container">
  <nav class="breadcrumb" style="margin:var(--space-5) 0 0;">
    <a href="../">Home</a> › <a href="../pages/scholarships">Scholarships</a> › ${esc(s.name)}
  </nav>

  <div class="layout-grid">
    <div class="detail-main">
      <section class="info-section">
        <h2>About this scholarship</h2>
        <p class="lead">${esc(cap(s.fundingSummary || "", 400))}${s.durationNote ? " " + esc(s.durationNote) : ""}</p>
        <div class="fact-grid">
          ${factRow("Provider", s.provider)}
          ${factRow("Country", s.country + (s.region ? " (" + s.region + ")" : ""))}
          ${factRow("Host university / institution", s.hostUniversities)}
          ${factRow("Degree levels", levels)}
          ${factRow("Fields of study", fields)}
          ${factRow("Funding type", funding)}
          ${factRow("Application fee", s.isFree ? "Free" : s.applicationFee)}
          ${factRow("Deadline", s.deadlineNote || s.deadlineMonth)}
          ${factRow("Intake", s.intake)}
          ${factRow("Applications open", s.opensMonth ? s.opensMonth.charAt(0).toUpperCase() + s.opensMonth.slice(1) : "Varies")}
          ${factRow("Competition", s.competition)}
          ${factRow("Programme duration", s.durationNote)}
        </div>
        <div class="chips-row" style="margin-top:var(--space-3);">
          ${asArray(s.levels).map((l) => `<span class="pill">${esc(l)}</span>`).join("")}
          ${asArray(s.fields).slice(0, 6).map((f) => `<span class="pill pill-blue">${esc(f)}</span>`).join("")}
        </div>
      </section>

      <section class="info-section">
        <h2>${esc(s.name)} eligibility criteria</h2>
        <ul class="req-list">
          ${asArray(s.eligibility).map((e) => `<li>${esc(e)}</li>`).join("")}
        </ul>
      </section>

      <section class="info-section">
        <h2>Benefits and coverage</h2>
        <ul class="perk-list">
          ${asArray(s.benefits).map((b) => `<li>${esc(b)}</li>`).join("")}
        </ul>
      </section>

      <section class="info-section">
        <h2>Required documents</h2>
        <ul class="req-list">
          ${asArray(s.documentsRequired).map((d) => `<li>${esc(d)}</li>`).join("")}
        </ul>
      </section>

      <section class="info-section">
        <h2>How to apply for the ${esc(s.name)}</h2>
        <ol class="req-list how-to-apply-list">
          <li>Review the eligibility criteria above and confirm you meet every requirement.</li>
          <li>Prepare all required documents early — transcripts, CV, recommendation letters and motivation letter.</li>
          <li>${s.deadlineNote ? esc(s.deadlineNote) + " " : ""}Submit a complete application before the ${esc(s.deadlineMonth || "official")} deadline.</li>
          <li>Always confirm the latest details on the official website before applying.</li>
        </ol>
        <div class="apply-meta" style="border:none;padding:var(--space-4) 0 0;">
          <div class="apply-meta-row"><span>Amount / coverage</span><span>${esc(cap(s.fundingSummary || "", 90))}</span></div>
          <div class="apply-meta-row"><span>Levels</span><span>${esc(levels)}</span></div>
        </div>
      </section>

      <section class="info-section">
        <h2>Frequently asked questions</h2>
        <div class="faq-list">
          ${faq.map((f) => `<div class="faq-item"><button class="faq-q" type="button">${esc(f.q)}<span class="faq-toggle">+</span></button><div class="faq-a"><p>${esc(f.a)}</p></div></div>`).join("")}
        </div>
      </section>
    </div>

    <div class="detail-side">
      <div class="apply-box">
        <div class="apply-fee ${s.isFree ? "free" : "paid"}">${esc(s.isFree ? "No application fee — apply free" : "Application fee: " + (s.applicationFee || "check official site"))}</div>
        <a class="btn btn-primary btn-lg apply-cta" href="${esc(s.applyLink || s.infoLink || "#")}" target="_blank" rel="noopener nofollow sponsored">Apply on the official website →</a>
        <a class="btn btn-ghost btn-lg apply-cta" style="margin-top:var(--space-3);" href="${esc(s.infoLink || s.applyLink || "#")}" target="_blank" rel="noopener nofollow">Official info page</a>
        <div class="apply-meta">
          <div class="apply-meta-row"><span>Deadline</span><span>${esc(s.deadlineMonth || "Varies")}</span></div>
          <div class="apply-meta-row"><span>Opens</span><span>${esc(s.opensMonth ? s.opensMonth.charAt(0).toUpperCase() + s.opensMonth.slice(1) : "Varies")}</span></div>
          <div class="apply-meta-row"><span>Intake</span><span>${esc(s.intake || "Varies")}</span></div>
          <div class="apply-meta-row"><span>Competition</span><span>${esc(s.competition || "Varies")}</span></div>
          <div class="apply-meta-row"><span>Country</span><span>${esc(s.country)}</span></div>
        </div>
        <p class="apply-disclaimer">Deadlines and details change — always confirm on the official website before applying.</p>
      </div>

      <div class="info-section sticky" style="margin-top:var(--space-6);">
        <h2>Study in ${esc(s.country)}</h2>
        <p class="muted">Practical guides on universities, costs, scholarships and visas.</p>
        ${countryPageLink(s)}
        <a class="pill" style="margin-top:var(--space-3);" href="../pages/study">Browse all study guides →</a>
      </div>
    </div>
  </div>

  <section class="info-section" style="margin:var(--space-8) 0;">
    <h2>Related guides</h2>
    <p class="muted">Learn how to win scholarships and build a strong application.</p>
    <div class="related-grid">
      ${relatedPosts(s, posts)}
    </div>
  </section>
</div>

<footer class="footer">
  <div class="container">
    <div class="footer-bottom" style="border:none;">
      <p>© <span id="footerYear"></span> AbroadReady.org — Always confirm details on the official scholarship website before applying.</p>
    </div>
  </div>
</footer>
<div style="height:var(--space-8)"></div>
<script src="../js/components.js"></script>
<script>document.getElementById('footerYear').textContent = new Date().getFullYear();</script>
<script>
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () { q.parentElement.classList.toggle('active'); });
  });
});
</script>
</body>
</html>
`;
  return body;
}

function noscriptListBlock(scholarships) {
  const items = scholarships.map((s) => {
    const levels = asArray(s.levels).join("/");
    const funding = (s.fundingType || "").toLowerCase() === "partial" ? "Partial" : "Fully Funded";
    return `<li><a href="scholarship-${s.id}">${esc(s.name)}</a> — ${esc(s.country || "")}, ${esc(levels || "Various")} (${funding})</li>`;
  }).join("\n");
  return `<noscript>
     <h2 style="margin:2rem 0 1rem;">Available Scholarships</h2>
     <p style="margin-bottom:1.5rem;color:#555;">Browse ${scholarships.length}+ fully funded and partial scholarships. Use the filters above to narrow by degree level, region, field and funding type.</p>
     <ul style="list-style:disc;padding-left:1.5rem;line-height:2;">
${items}
     </ul>
   </noscript>`;
}

function patchFile(rootRel) {
  const p = path.join(ROOT, rootRel);
  if (!fs.existsSync(p)) return { file: rootRel, changed: false };
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  s = s.replace(/scholarship\?id=/g, "scholarship-");
  if (s !== before) { fs.writeFileSync(p, s, "utf8"); }
  return { file: rootRel, changed: s !== before };
}

function main() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "scholarships.json"), "utf8"));
  const scholarships = Array.isArray(raw) ? raw : (raw.scholarships || []);
  const blog = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "blog.json"), "utf8"));
  const posts = blog.posts || [];
  let count = 0;
  for (const s of scholarships) {
    if (!s || !s.id) continue;
    const html = scholarshipPage(s, posts);
    fs.writeFileSync(path.join(ROOT, "pages", `scholarship-${s.id}.html`), html, "utf8");
    count++;
  }
  console.log(`Generated ${count} scholarship pages`);

  // Rewrite the crawlable <noscript> list inside pages/scholarships.html
  const sp = path.join(ROOT, "pages", "scholarships.html");
  let listPage = fs.readFileSync(sp, "utf8");
  const block = noscriptListBlock(scholarships);
  listPage = listPage.replace(/<noscript>[\s\S]*?<\/noscript>/, block);
  fs.writeFileSync(sp, listPage, "utf8");
  console.log("Rewrote <noscript> scholarship list in pages/scholarships.html");

  // Replace legacy links across static pages and JS templates
  for (const f of ["pages/scholarships.html", "pages/saved.html", "index.html", "js/advisor.js", "js/landing.js", "js/scholarships.js"]) {
    const r = patchFile(f);
    if (r.changed) console.log("Patched links in:", f);
  }

  // Convert pages/scholarship.html into a noindex redirect to the static page
  const redirect = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,follow">
  <title>Scholarship Details | AbroadReady</title>
  <meta name="description" content="Scholarship details for this program have moved to a dedicated page. Browse all scholarships at AbroadReady.">
  <link rel="canonical" href="https://abroadready.org/pages/scholarships">
  <meta property="og:title" content="Scholarships | AbroadReady">
  <meta property="og:description" content="Browse fully funded and partial international scholarships at AbroadReady.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://abroadready.org/pages/scholarships">
  <meta property="og:image" content="https://abroadready.org/assets/blog/scholarships.jpg">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Scholarships | AbroadReady">
  <script>
  (function () {
    var id = new URLSearchParams(location.search).get('id');
    if (id) location.replace('scholarship-' + id);
    else location.replace('../pages/scholarships');
  })();
  </script>
</head>
<body>
  <p>This scholarship has moved. <a href="../pages/scholarships">Go to all scholarships</a>.</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, "pages", "scholarship.html"), redirect, "utf8");
  console.log("Converted pages/scholarship.html to noindex redirect");

  // Append scholarship pages to sitemap.xml
  const sm = path.join(ROOT, "sitemap.xml");
  if (fs.existsSync(sm)) {
    let xml = fs.readFileSync(sm, "utf8");
    const urls = scholarships.map((s) =>
      `  <url><loc>${DOMAIN}/pages/scholarship-${s.id}</loc><changefreq>daily</changefreq></url>`
    );
    xml = xml.replace("</urlset>", urls.join("\n") + "\n</urlset>");
    fs.writeFileSync(sm, xml, "utf8");
    console.log("Appended", scholarships.length, "scholarship URLs to sitemap.xml");
  }

  console.log("Done.");
}

main();