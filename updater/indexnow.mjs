#!/usr/bin/env node
/*
 * indexnow.mjs — Submit all AbroadReady URLs to IndexNow
 * (Bing, Yandex, Seznam, Naver). Run AFTER deploying to the live site:
 *   node updater/indexnow.mjs
 * Verifies the key file is live, then POSTs up to 10,000 URLs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOMAIN = "https://abroadready.org";
const HOST = "abroadready.org";
const KEY = "c63345d8-0d15-4662-96af-227f5be1539c";

function allUrls() {
  const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return locs;
}

async function keyLive() {
  const keyUrl = `${DOMAIN}/${KEY}.txt`;
  try {
    const res = await fetch(keyUrl);
    const body = await res.text();
    if (res.status !== 200 || !body.trim().startsWith(KEY)) {
      throw new Error(`key not live at ${keyUrl} (status ${res.status})`);
    }
    console.log(`OK: key file live at ${keyUrl}`);
    return true;
  } catch (e) {
    console.error(`FAIL: cannot verify key file: ${e.message}`);
    return false;
  }
}

async function submit(urls) {
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `${DOMAIN}/${KEY}.txt`, urlList: urls });
  console.log(`Submitting ${urls.length} URLs to https://api.indexnow.org/indexnow ...`);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body,
  });
  console.log(`Response: HTTP ${res.status}`);
  if (res.status !== 200) console.log(await res.text());
  return res.status === 200;
}

const urls = allUrls();
console.log(`Found ${urls.length} URLs from sitemap.xml`);
if (!(await keyLive())) process.exit(1);
const ok = await submit(urls);
process.exit(ok ? 0 : 1);
