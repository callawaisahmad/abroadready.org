#!/usr/bin/env node
/*
 * full-seo-audit.js - AbroadReady release gate.
 *
 * Run from the repo root:
 *     node "%TEMP%\opencode\full-seo-audit.js"
 *
 * Exits 0 only when ERRORS = 0 AND WARNINGS = 0 (i.e. "0/0"), so it can be used
 * as the pre-push gate described in AGENTS.md. A full report is written to
 * full-seo-audit.txt next to this script. INFO items are reported for awareness
 * but never fail the gate.
 *
 * Differences from tools/seo-audit.js:
 *   - decodes HTML entities before measuring title/meta length, so titles that
 *     only look too long because of &amp;/&#x27; are not false positives
 *   - skips head requirements on deliberate noindex pages (redirect stubs)
 *   - resolves internal links correctly (root-relative, ../ and extensionless)
 *     and ignores inline <script> contents (dynamically built hrefs)
 *   - resolves each file's intended canonical instead of comparing a file path
 *     with a URL
 *   - also checks duplicate canonical claims and sitemap integrity
 */
"use strict";
const fs = require("fs");
const path = require("path");

const DOMAIN = "https://abroadready.org";

/* ------------------------------------------------------------------ paths */
const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, "data", "blog.json"))) {
  console.error("Run this from the repo root (data/blog.json not found in " + ROOT + ").");
  process.exit(2);
}
const OUT = path.join(__dirname, "full-seo-audit.txt");

/* ---------------------------------------------------------------- helpers */
const ENT = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "\u2014", ndash: "\u2013", hellip: "\u2026", middot: "\u00b7",
  lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d",
  laquo: "\u00ab", raquo: "\u00bb", times: "\u00d7", divide: "\u00f7",
  euro: "\u20ac", pound: "\u00a3", yen: "\u00a5", dollar: "$", deg: "\u00b0",
  plusmn: "\u00b1", frac12: "\u00bd", frac14: "\u00bc", sup2: "\u00b2", sup3: "\u00b3",
  le: "\u2264", ge: "\u2265", ne: "\u2260", minus: "\u2212", prime: "\u2032",
  rarr: "\u2192", larr: "\u2190", uarr: "\u2191", darr: "\u2193", harr: "\u2194",
  bull: "\u2022", dagger: "\u2020", copy: "\u00a9", reg: "\u00ae", trade: "\u2122",
  eacute: "\u00e9", egrave: "\u00e8", agrave: "\u00e0", ccedil: "\u00e7",
  uuml: "\u00fc", ouml: "\u00f6", auml: "\u00e4", szlig: "\u00df", ntilde: "\u00f1",
  shy: "", ensp: " ", emsp: " ", thinsp: " ", zwj: "", zwnj: "",
};
function decode(s) {
  return String(s)
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return m; } })
    .replace(/&#(\d+);/g, (m, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return m; } })
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, n) => (Object.prototype.hasOwnProperty.call(ENT, n.toLowerCase()) ? ENT[n.toLowerCase()] : m));
}
const collapse = (s) => decode(s).replace(/\s+/g, " ").trim();
const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', "i"));
  if (!m) return null;
  return decode(m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4]);
};

/* ----------------------------------------------------------- file listing */
const files = [];
for (const f of fs.readdirSync(ROOT)) if (f.endsWith(".html")) files.push(f);
for (const f of fs.readdirSync(path.join(ROOT, "pages"))) if (f.endsWith(".html")) files.push("pages/" + f);
files.sort();

const norm = (u) => u.replace(/\/+$/, "");
const fileToUrl = (f) => {
  if (f === "index.html") return DOMAIN;
  if (f === "404.html") return DOMAIN + "/404.html"; // GitHub Pages serves it at .html
  return DOMAIN + "/" + f.replace(/\.html$/, "");
};
/* Normalise a URL to the relative file it represents ("" means the homepage). */
const urlToRel = (u) => (norm(u) === DOMAIN ? "" : norm(u).replace(DOMAIN + "/", ""));

/* Paths that intentionally do not point at themselves. Keep this list short and
 * explicit so real regressions are still caught. */
const ALLOW_NONSELF_CANONICAL = {
  "pages/results.html": DOMAIN + "/pages/scholarships",
  "pages/scholarship.html": DOMAIN + "/pages/scholarships",
};

function targetExists(rel) {
  if (rel === "") return fs.existsSync(path.join(ROOT, "index.html"));
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return true;
  if (!/\.\w+$/.test(rel) && fs.existsSync(abs + ".html")) return true;
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory() && fs.existsSync(path.join(abs, "index.html"))) return true;
  return false;
}

/* ----------------------------------------------------------------- checks */
const errors = [];
const warnings = [];
const infos = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);
const info = (f, m) => infos.push(`${f}: ${m}`);

const stats = { pages: 0, noindex: 0 };
const canonicalClaims = new Map(); // href -> [file]

for (const file of files) {
  const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
  stats.pages++;

  const isNoindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(raw);
  if (isNoindex) stats.noindex++;

  /* ---- title ---- */
  const tm = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!tm) err(file, "missing <title>");
  else {
    const t = collapse(tm[1]);
    if (t.length < 25) err(file, `title too short (${t.length}): "${t}"`);
    else if (t.length > 65) err(file, `title too long (${t.length}): "${t}"`);
  }

  /* ---- meta description ---- */
  const dm = raw.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  if (!dm) err(file, "missing meta description");
  else {
    const d = collapse(attr(dm[0], "content") || "");
    if (d.length < 100) err(file, `meta description too short (${d.length})`);
    else if (d.length > 165) err(file, `meta description too long (${d.length})`);
  }

  /* ---- canonical ---- */
  const cm = raw.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!cm) {
    if (!isNoindex) err(file, "missing rel=canonical");
  } else {
    const href = (attr(cm[0], "href") || "").trim();
    if (!/^https:\/\//.test(href)) err(file, `canonical is not absolute: "${href}"`);
    else {
      const self = fileToUrl(file);
      if (norm(href) !== norm(self) && href !== ALLOW_NONSELF_CANONICAL[file]) {
        err(file, `canonical is neither self nor allowlisted: "${href}"`);
      }
      if (!targetExists(urlToRel(href))) err(file, `canonical target does not exist: "${href}"`);
      if (!canonicalClaims.has(href)) canonicalClaims.set(href, []);
      canonicalClaims.get(href).push(file);
    }
  }

  /* ---- headings ---- */
  const body = (raw.match(/<body[\s\S]*?<\/body>/i) || [raw])[0]
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const h1s = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length === 0) { if (!isNoindex) err(file, "no <h1>"); }
  else if (h1s.length > 1) err(file, `${h1s.length} <h1> elements`);
  else if (!collapse(h1s[0][1])) err(file, "empty <h1>");

  const order = [...body.matchAll(/<h([1-4])\b[^>]*>/gi)].map((m) => Number(m[1]));
  let prev = 0;
  for (const lvl of order) {
    if (prev && lvl > prev + 1) { info(file, `heading level jump h${prev} -> h${lvl}`); break; }
    prev = lvl;
  }

  /* ---- structured data ---- */
  const lds = [...raw.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!lds.length) { if (!isNoindex) err(file, "no JSON-LD structured data"); }
  else for (const l of lds) {
    try { JSON.parse(l[1]); } catch (e) { err(file, "invalid JSON-LD: " + e.message.slice(0, 60)); }
  }

  /* ---- social / meta ---- */
  if (!isNoindex) {
    if (!/<meta[^>]+property=["']og:title["']/i.test(raw)) err(file, "missing og:title");
    if (!/<meta[^>]+property=["']og:image["']/i.test(raw)) err(file, "missing og:image");
    if (!/<meta[^>]+name=["']twitter:card["']/i.test(raw)) err(file, "missing twitter:card");
  }
  if (!/<html[^>]+lang=/i.test(raw)) err(file, "missing <html lang>");
  if (!/<meta[^>]+name=["']viewport["']/i.test(raw)) err(file, "missing viewport meta");

  /* ---- images ---- */
  for (const t of [...raw.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])) {
    if (!/\balt\s*=/i.test(t)) { err(file, "img without alt: " + t.slice(0, 70)); break; }
  }

  /* ---- tag balance ---- */
  const BAL = ["div", "section", "article", "aside", "main", "nav", "header", "footer", "ul", "ol", "a", "h1", "h2", "h3", "h4", "table", "thead", "tbody", "tr", "td", "th", "span"];
  for (const tag of BAL) {
    const open = (raw.match(new RegExp("<" + tag + "\\b", "gi")) || []).length;
    const close = (raw.match(new RegExp("</" + tag + "\\s*>", "gi")) || []).length;
    if (open !== close) warn(file, `unbalanced <${tag}>: ${open} open / ${close} close`);
  }

  /* ---- internal links (inline <script> content excluded) ---- */
  const inlineScript = [];
  for (const m of raw.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const start = m.index + m[0].indexOf(">") + 1;
    inlineScript.push([start, start + m[1].length]);
  }
  const inInlineScript = (i) => inlineScript.some(([a, b]) => i >= a && i < b);
  const dir = path.posix.dirname(file);
  for (const m of raw.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    if (inInlineScript(m.index)) continue;
    let u = m[1].trim();
    if (!u || /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(u)) continue;
    u = u.split("#")[0].split("?")[0].trim().replace(/&amp;/g, "&");
    if (!u) continue;
    const rel = u.startsWith("/") ? u.replace(/^\//, "") : path.posix.normalize(path.posix.join(dir, u));
    if (rel.startsWith("..")) continue;
    if (!targetExists(rel)) err(file, `broken internal link: "${u}"`);
  }
}

/* ---- duplicate canonical claims ---- */
for (const [href, claimants] of canonicalClaims) {
  if (claimants.length < 2) continue;
  const unexpected = claimants.filter((f) => norm(fileToUrl(f)) !== norm(href) && ALLOW_NONSELF_CANONICAL[f] !== href);
  for (const f of unexpected) err(f, `canonical "${href}" is also claimed by ${claimants.filter((x) => x !== f).join(", ")}`);
}

/* ---- sitemap integrity ---- */
const SM = path.join(ROOT, "sitemap.xml");
if (!fs.existsSync(SM)) err("sitemap.xml", "file is missing");
else {
  const sm = fs.readFileSync(SM, "utf8");
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const seen = new Set();
  for (const l of locs) {
    if (seen.has(l)) err("sitemap.xml", `duplicate <loc>: ${l}`);
    seen.add(l);
    if (!targetExists(urlToRel(l))) err("sitemap.xml", `loc does not exist: ${l}`);
  }
  for (const f of files) {
    const noindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(fs.readFileSync(path.join(ROOT, f), "utf8"));
    if (!noindex && !seen.has(fileToUrl(f))) info("sitemap.xml", `indexable page not in sitemap: ${f}`);
  }
}

/* --------------------------------------------------------------- report */
const lines = [];
lines.push("======= FULL SEO AUDIT (release gate) =======");
lines.push(`pages scanned: ${stats.pages}   (noindex pages skipped for head checks: ${stats.noindex})`);
lines.push(`ERRORS: ${errors.length}`);
lines.push(`WARNINGS: ${warnings.length}`);
lines.push(`INFO: ${infos.length}`);
lines.push("");
if (errors.length) { lines.push("--- ERRORS ---"); for (const e of errors) lines.push("  " + e); lines.push(""); }
if (warnings.length) { lines.push("--- WARNINGS ---"); for (const w of warnings) lines.push("  " + w); lines.push(""); }
if (infos.length) { lines.push("--- INFO (non-blocking) ---"); for (const i of infos) lines.push("  " + i); lines.push(""); }
lines.push(!errors.length && !warnings.length ? "RESULT: PASS (0 errors / 0 warnings)" : "RESULT: FAIL");

const report = lines.join("\n") + "\n";
fs.writeFileSync(OUT, report, "utf8");
process.stdout.write(report);
process.exit(errors.length || warnings.length ? 1 : 0);
