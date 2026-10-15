#!/usr/bin/env node
/* check-html.mjs — HTML tag balance check.
 *
 * Project rules require a tag-balance check on every edited HTML file. Run it
 * with no arguments to check every page in the repo, or pass specific files:
 *
 *   node tools/check-html.mjs
 *   node tools/check-html.mjs pages/sop-builder.html index.html
 *
 * Stack-based, so it also catches crossed tags (<b><i></b></i>), which a naive
 * open/close count cannot. Void elements are ignored, and script/style bodies,
 * comments and quoted attribute values are stripped first so that a '<' inside
 * a JS string or a data attribute is not mistaken for a tag.
 *
 * Exits non-zero if any file is unbalanced.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
  "meta", "param", "source", "track", "wbr",
]);

/* Directories that hold no page markup. */
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".opencode", "DONT UPLOAD", "assets",
  "updater", "tools", "js", "css",
]);

function collect(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) collect(path.join(dir, e.name), out);
    } else if (e.name.endsWith(".html")) {
      out.push(path.relative(ROOT, path.join(dir, e.name)).replace(/\\/g, "/"));
    }
  }
  return out;
}

const requested = process.argv.slice(2);
const files = requested.length ? requested : collect(ROOT, []).sort();

function check(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return { rel, missing: true };

  let html = fs.readFileSync(abs, "utf8");
  html = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/="[^"]*"/g, '=""')
    .replace(/='[^']*'/g, "=''");

  const stack = [];
  const problems = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
    const closing = m[1] === "/";
    const name = m[2].toLowerCase();
    if (VOID.has(name) || m[3] === "/") continue;
    if (!closing) {
      stack.push(name);
      continue;
    }
    const at = stack.lastIndexOf(name);
    if (at === -1) {
      problems.push(`stray </${name}>`);
    } else {
      for (let i = stack.length - 1; i > at; i--) problems.push(`unclosed <${stack[i]}>`);
      stack.length = at;
    }
  }
  for (const t of stack) problems.push(`unclosed <${t}>`);

  return { rel, problems: [...new Set(problems)] };
}

let bad = 0;
for (const rel of files) {
  const r = check(rel);
  if (r.missing) {
    bad++;
    console.log(`MISSING  ${rel}`);
  } else if (r.problems.length) {
    bad++;
    console.log(`FAIL     ${rel}`);
    for (const p of r.problems.slice(0, 12)) console.log(`             ${p}`);
    if (r.problems.length > 12) console.log(`             ...and ${r.problems.length - 12} more`);
  } else if (requested.length) {
    console.log(`ok       ${rel}`);
  }
}

if (bad) {
  console.log(`\n${bad} of ${files.length} file(s) FAILED tag balance`);
  process.exit(1);
}
console.log(`\nall ${files.length} file(s) balanced`);
