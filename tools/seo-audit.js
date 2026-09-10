const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const out = [];
const log = (...a) => out.push(a.join(" "));

function read(p) { try { return fs.readFileSync(path.join(ROOT, p), "utf8"); } catch { return null; } }

const htmlFiles = [];
function walk(dir, base) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (e.name.endsWith(".html")) htmlFiles.push(path.join(dir, e.name).replace(/\\/g, "/"));
  }
}
walk("pages");
htmlFiles.push("index.html", "404.html");

const pages = htmlFiles.filter((f) => !/^pages\/[0-9a-f]{8}-/.test(f)).sort();
const usable = [];
const problems = { missingTitle: [], longTitle: [], shortTitle: [], missingDesc: [], longDesc: [], shortDesc: [],
  noCanonical: [], dupCanonical: [], noH1: [], multiH1: [], missingAlt: [], badSchema: [], noOg: [],
  noRobots: [], noLang: [], noViewport: [], noTwitter: [], emptyH1: [] };
const canonicalCount = {};
const itemCounts = {};

for (const f of pages) {
  const h = read(f);
  if (!h) continue;
  usable.push(f);
  const item = { file: f };

  // lang / viewport / charset
  if (!/<html[^>]*lang="/.test(h)) problems.noLang.push(f);
  if (!/name="viewport"/.test(h)) problems.noViewport.push(f);
  if (!/<meta charset=/i.test(h)) log("NO CHARSET:", f);

  // title
  const tm = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(h);
  const title = tm ? tm[1].replace(/\s+/g, " ").trim() : "";
  if (!title) problems.missingTitle.push(f);
  else {
    const len = [...title].length;
    if (len > 65) problems.longTitle.push(`${f} (${len})`);
    if (len < 25) problems.shortTitle.push(`${f} (${len})`);
  }
  item.title = title;

  // meta description
  const dm = /<meta\s+name="description"\s+content="([\s\S]*?)"/i.exec(h);
  const desc = dm ? dm[1].replace(/\s+/g, " ").trim() : "";
  if (!desc) problems.missingDesc.push(f);
  else {
    const len = [...desc].length;
    if (len > 165) problems.longDesc.push(`${f} (${len})`);
    if (len < 100) problems.shortDesc.push(`${f} (${len})`);
  }
  item.desc = desc;

  // canonical
  const cm = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(h);
  const canon = cm ? cm[1] : "";
  if (!canon) problems.noCanonical.push(f);
  else {
    const cw = canon.replace(/\/$/, "");
    canonicalCount[cw] = (canonicalCount[cw] || 0) + 1;
    const exp = "https://abroadready.org" + (f === "index.html" ? "" : "/" + f.replace(/\.html$/, ""));
    if (cw !== exp.replace(/^https:\/\/abroadready\.org\/$/, "https://abroadready.org")) problems.dupCanonical.push(`${f} -> ${canon}`);
  }
  item.canonical = canon;

  // H1
  const h1s = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []).map((x) => x.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  if (h1s.length === 0) problems.noH1.push(f);
  if (h1s.length > 1) problems.multiH1.push(`${f} [${h1s.length}]`);
  if (h1s.length === 1 && !h1s[0]) problems.emptyH1.push(f);
  item.h1 = h1s[0] || "";

  // headings sequence (skip first since data may be rendered by JS, but static check)
  const headings = [...h.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ lvl: +m[1], text: m[2].replace(/<[^>]+>/g, "").trim() }));
  const limited = headings.slice(0, 60);
  let maxSeen = 0; const jumps = [];
  for (let i = 0; i < limited.length; i++) {
    if (limited[i].lvl > maxSeen + 1) jumps.push(limited[i].lvl + ":" + limited[i].text.slice(0, 20));
    maxSeen = Math.max(maxSeen, limited[i].lvl);
  }
  if (jumps.length) { problems.headingJumps = problems.headingJumps || {}; problems.headingJumps[f] = jumps; }

  // img alt
  const imgs = [...h.matchAll(/<img[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((i) => !/alt=/.test(i));
  if (noAlt.length) problems.missingAlt.push(`${f} (${noAlt.length} imgs)`);

  // schema JSON-LD validity
  const lds = [...h.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  if (!lds.length) problems.badSchema.push(`${f} (no JSON-LD)`);
  else for (const m of lds) { try { JSON.parse(m[1]); } catch (e) { problems.badSchema.push(`${f} (invalid JSON-LD)`); } }
  item.schemaTypes = lds.map((m) => { try { const j = JSON.parse(m[1]); return Array.isArray(j) ? j[0]["@type"] : j["@type"]; } catch { return "??"; } });

  // og / twitter
  if (!/<meta\s+property="og:title"/.test(h)) problems.noOg.push(f + " og:title");
  if (!/<meta\s+property="og:image"/.test(h)) problems.noOg.push(f + " og:image");
  if (!/<meta\s+name="twitter:card"/.test(h)) problems.noTwitter.push(f);

  // robots meta
  const rb = /<meta\s+name="robots"\s+content="([^"]+)"/i.exec(h);
  item.robots = rb ? rb[1] : null;

  // internal links
  const links = [...h.matchAll(/href="([^"#]+)"/g)].map((m) => m[1]);
  item.internal = links.filter((l) => !/^(https?:|mailto:|tel:|data:)/.test(l)).length;
  const broken = [];
  for (const l of links) {
    if (/^https?:|mailto:|tel:|data:|javascript:/i.test(l)) continue;
    const clean = l.split("#")[0].split("?")[0].replace(/^\.\.\//, "").replace(/^\//, "").replace(/\.html$/, "");
    if (!clean) continue;
    const target = clean === "" ? "index.html" : clean.endsWith("/") ? "index.html" : clean;
    if (clean === "index" || clean === "") { continue; }
    const file = clean + ".html";
    if (!["index.html", "404.html"].includes(file) && !fs.existsSync(path.join(ROOT, "pages", file)) && !fs.existsSync(path.join(ROOT, file))) broken.push(l);
  }
  if (broken.length) { problems.brokenLinks = problems.brokenLinks || {}; problems.brokenLinks[f] = broken; }

  // external links rel
  const ext = [...h.matchAll(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>/g)].map((m) => m[0]);
  const extNoRel = ext.filter((a) => /target="_blank"/.test(a) && !/rel=/.test(a));
  if (extNoRel.length) { problems.noRelNoopener = problems.noRelNoopener || {}; problems.noRelNoopener[f] = extNoRel.length; }

  // word count + text ratio (body only)
  const body = (h.match(/<body[\s\S]*$/i) || [h])[0].replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = body.split(" ").filter(Boolean).length;
  item.words = words;
  itemCounts[words] = itemCounts[words] || [];
  itemCounts[words].push(f);
}

// report
log("======= AUDIT: " + pages.length + " pages scanned (" + usable.length + " readable) =======");
log("\n--- TITLES ---");
log("missing:", problems.missingTitle.length ? problems.missingTitle : "0");
log("too long >65:", problems.longTitle.length ? problems.longTitle.slice(0, 20) : "0", " count=" + problems.longTitle.length);
log("too short <25:", problems.shortTitle.length ? problems.shortTitle.slice(0, 20) : "0", " count=" + problems.shortTitle.length);

log("\n--- META DESCRIPTION ---");
log("missing:", problems.missingDesc.length ? problems.missingDesc : "0");
log("too long >165:", problems.longDesc.length ? problems.longDesc.slice(0, 20) : "0", " count=" + problems.longDesc.length);
log("too short <100:", problems.shortDesc.length ? problems.shortDesc.slice(0, 15) : "0", " count=" + problems.shortDesc.length);

log("\n--- CANONICAL ---");
log("missing:", problems.noCanonical.length ? problems.noCanonical : "0");
const dupC = Object.entries(canonicalCount).filter(([, c]) => c > 1);
log("duplicated canonical (same URL claimed by " + dupC.length + " groups):", dupC.length ? dupC.map(([u, c]) => u + " x" + c) : "0");
log("self-mismatch:", problems.dupCanonical.length ? problems.dupCanonical.slice(0, 25) : "0", " count=" + problems.dupCanonical.length);

log("\n--- H1 ---");
log("no H1:", problems.noH1.length ? problems.noH1 : "0");
log("multiple H1:", problems.multiH1.length ? problems.multiH1.slice(0, 15) : "0");

log("\n--- HEADINGS (skip jumps h1>h3 etc) ---");
const jumpFiles = Object.keys(problems.headingJumps || {});
log("pages with heading-level jumps:", jumpFiles.length ? jumpFiles.slice(0, 25) : "0");

log("\n--- IMAGES ---");
log("imgs missing alt:", problems.missingAlt.length ? problems.missingAlt.slice(0, 25) : "0", " count=" + problems.missingAlt.length);

log("\n--- STRUCTURED DATA ---");
log("no JSON-LD:", problems.badSchema.length ? problems.badSchema : "0");

log("\n--- OPEN GRAPH / TWITTER ---");
log("missing og:", problems.noOg.length ? problems.noOg.slice(0, 25) : "0", " count=" + problems.noOg.length);
log("missing twitter:card:", problems.noTwitter.length ? problems.noTwitter.slice(0, 25) : "0", " count=" + problems.noTwitter.length);

log("\n--- META ---");
log("no lang:", problems.noLang.length ? problems.noLang : "0");
log("no viewport:", problems.noViewport.length ? problems.noViewport : "0");

log("\n--- INTERNAL LINKS ---");
const breaks = Object.entries(problems.brokenLinks || {});
log("pages with broken internal links:", breaks.length ? breaks.map(([f, b]) => f + ": " + b.join(", ")).slice(0, 30) : "0");

log("\n--- EXTERNAL LINKS (target=_blank w/o rel) ---");
const rels = Object.entries(problems.noRelNoopener || {});
log("pages:", rels.length ? rels.slice(0, 20).map(([f, n]) => f + " (" + n + ")") : "0", " count=" + rels.map(([, n]) => n).reduce((a, b) => a + b, 0));

log("\n--- BODY WORD COUNT ---");
const data = usable.map((f) => {
  const h = read(f);
  const body = (h.match(/<body[\s\S]*$/i) || [h])[0].replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return [f, body.split(" ").filter(Boolean).length];
}).sort((a, b) => a[1] - b[1]);
log("lowest word count (thin content, <400):");
for (const [f, w] of data) if (w < 400) log("  " + f + " = " + w);
log("highest word count:");
for (const [f, w] of data.slice(-10)) log("  " + f + " = " + w);
log("median:", data[Math.floor(data.length / 2)][1]);

fs.writeFileSync(path.join(require("os").tmpdir(), "opencode", "seo-audit.txt"), out.join("\n"), "utf8");
console.log("written");