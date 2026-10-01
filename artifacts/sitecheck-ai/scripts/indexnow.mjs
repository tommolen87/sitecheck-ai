import fs from "node:fs/promises";
import path from "node:path";

const SITE_HOST = "https://www.sitecheckai.nl";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const key = process.env.INDEXNOW_KEY?.trim();

if (!key) {
  console.log("[IndexNow] INDEXNOW_KEY is not configured; skipping key file and URL submission.");
  process.exit(0);
}

if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  throw new Error("[IndexNow] INDEXNOW_KEY contains unexpected characters.");
}

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "dist", "public");
const sitemapPath = path.join(projectRoot, "sitemap.xml");

await fs.mkdir(publicDir, { recursive: true });

// Bing requires the key to be available in a UTF-8 text file whose filename is the key.
await fs.writeFile(path.join(publicDir, `${key}.txt`), key + "\n", "utf8");

const sitemap = await fs.readFile(sitemapPath, "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\\/loc>/g)]
  .map((match) => match[1].trim())
  .filter((url) => url.startsWith(SITE_HOST + "/") || url === SITE_HOST)
  .filter((url, index, list) => list.indexOf(url) === index);

if (urls.length === 0) {
  console.log("[IndexNow] No URLs found in sitemap.xml; skipping submission.");
  process.exit(0);
}

const response = await fetch(INDEXNOW_ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    host: "www.sitecheckai.nl",
    key,
    keyLocation: `${SITE_HOST}/${key}.txt`,
    urlList: urls,
  }),
});

if (!response.ok) {
  const body = await response.text().catch(() => "");
  throw new Error(
    `[IndexNow] Submission failed with HTTP ${response.status}${body ? `: ${body}` : ""}`,
  );
}

console.log(`[IndexNow] Submitted ${urls.length} URLs successfully.`);
