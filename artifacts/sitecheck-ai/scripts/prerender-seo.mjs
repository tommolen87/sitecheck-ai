import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const appSource = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
const blogSource = fs.readFileSync(path.join(root, 'src', 'lib', 'blog-data.ts'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

function esc(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function findObjectBlock(source, key) {
  const escaped = key.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|\\n)\\s*(?:["']${escaped}["']|${escaped})\\s*:\\s*\\{`);
  const match = re.exec(source);
  if (!match) return null;
  const start = source.indexOf('{', match.index);
  let depth = 0, quote = null, escapedChar = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escapedChar) { escapedChar = false; continue; }
      if (ch === '\\') { escapedChar = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  return null;
}

function findObjectBlocks(source, key) {
  const blocks = [];
  let cursor = 0;
  while (cursor < source.length) {
    const remaining = source.slice(cursor);
    const block = findObjectBlock(remaining, key);
    if (!block) break;
    blocks.push(block);
    cursor += remaining.indexOf(block) + block.length;
  }
  return blocks;
}

function readString(block, field) {
  const match = new RegExp(`${field}\\s*:\\s*(["'])(.*?)\\1\\s*(?:,|$)`, 's').exec(block);
  return match ? match[2].replace(/\\(["'])/g, '$1') : '';
}

function pageData(slug, locale) {
  for (const block of findObjectBlocks(appSource, slug)) {
    const localeBlock = findObjectBlock(block, locale);
    if (localeBlock) {
      return {
        title: readString(localeBlock, 'title'),
        description: readString(localeBlock, 'description'),
        heading: readString(localeBlock, 'heading'),
        intro: readString(localeBlock, 'intro'),
      };
    }
  }
  return null;
}

function blogData(slug, locale) {
  const marker = `slug: "${slug}"`;
  const markerIndex = blogSource.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = blogSource.lastIndexOf('{', markerIndex);
  let depth = 0, quote = null, escapedChar = false;
  for (let i = start; i < blogSource.length; i += 1) {
    const ch = blogSource[i];
    if (quote) {
      if (escapedChar) { escapedChar = false; continue; }
      if (ch === '\\') { escapedChar = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}' && --depth === 0) {
      const localeBlock = findObjectBlock(blogSource.slice(start, i + 1), locale);
      if (!localeBlock) return null;
      return {
        title: readString(localeBlock, 'title'),
        description: readString(localeBlock, 'description'),
        heading: readString(localeBlock, 'title'),
        intro: readString(localeBlock, 'intro'),
      };
    }
  }
  return null;
}

function fallbackData(slug, locale) {
  const label = slug.replaceAll('-', ' ');
  const intro = locale === 'nl' ? 'Controleer je website met SiteCheck AI en ontdek concrete verbeterpunten.'
    : locale === 'de' ? 'Prüfe deine Website mit SiteCheck AI und entdecke konkrete Verbesserungen.'
    : locale === 'fr' ? 'Vérifiez votre site avec SiteCheck AI et découvrez des améliorations concrètes.'
    : locale === 'es' ? 'Comprueba tu sitio con SiteCheck AI y descubre mejoras concretas.'
    : 'Check your website with SiteCheck AI and discover practical improvements.';
  return { title: `${label.charAt(0).toUpperCase() + label.slice(1)} | SiteCheck AI`, description: intro, heading: label.charAt(0).toUpperCase() + label.slice(1), intro };
}

function render(templateHtml, data, locale, canonical) {
  const parts = new URL(canonical).pathname.split('/').filter(Boolean);
  const slug = parts.slice(1).join('/');
  const alternates = ['nl','en','de','fr','es'].map((l) => `<link rel="alternate" hreflang="${l}" href="https://www.sitecheckai.nl/${l}/${slug}">`).join('');
  const head = `<link rel="canonical" href="${esc(canonical)}"><meta name="robots" content="index, follow"><meta name="description" content="${esc(data.description)}"><meta property="og:title" content="${esc(data.title)}"><meta property="og:description" content="${esc(data.description)}">${alternates}`;
  const cta = locale === 'nl' ? 'Start gratis scan' : locale === 'de' ? 'Kostenlosen Scan starten' : locale === 'fr' ? 'Lancer l’analyse gratuite' : locale === 'es' ? 'Iniciar análisis gratuito' : 'Start free scan';
  const body = `<main><article><p>SiteCheck AI</p><h1>${esc(data.heading)}</h1><p>${esc(data.intro)}</p><p>${esc(data.description)}</p><p><a href="/${locale}">${cta}</a></p></article></main>`;
  return templateHtml
    .replace(/<html[^>]*>/, `<html lang="${locale}">`)
    .replace(/<title>[^<]*<\\/title>/, `<title>${esc(data.title)}</title>`)
    .replace('</head>', `${head}</head>`)
    .replace(/<div id="root">[\\s\\S]*?<\\/div>/, `<div id="root">${body}</div>`);
}

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\\/loc>/g)].map((m) => m[1]);
let generated = 0;
for (const url of urls) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (!parts.length) continue;
  const locale = parts[0];
  if (!['nl','en','de','fr','es'].includes(locale)) continue;
  const rest = parts.slice(1);
  let data;
  if (rest[0] === 'blog' && rest[1]) data = blogData(rest[1], locale === 'nl' || locale === 'en' ? locale : 'en');
  else if (rest[0] === 'blog') data = { title: locale === 'nl' ? 'Website tips en SEO kennis | SiteCheck AI' : 'Website & SEO Guides | SiteCheck AI', description: locale === 'nl' ? 'Praktische artikelen over SEO, websites, snelheid, conversie en online vindbaarheid.' : 'Practical guides about SEO, websites, speed, conversion and search visibility.', heading: locale === 'nl' ? 'Praktische kennis over websites, SEO en conversie.' : 'Practical guides about websites, SEO and conversion.', intro: locale === 'nl' ? 'Heldere artikelen voor ondernemers.' : 'Clear guides for business owners.' };
  else data = pageData(rest[0], locale);
  if (!data?.title) data = fallbackData(rest.join('-'), locale);
  const target = path.join(dist, ...parts, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, render(template, data, locale, parsed.href));
  generated += 1;
}
console.log(`SEO prerender: generated ${generated} static route pages.`);
