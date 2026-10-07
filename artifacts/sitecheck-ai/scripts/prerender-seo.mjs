import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist', 'public');
const appSource = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
const blogSource = fs.readFileSync(path.join(root, 'src', 'lib', 'blog-data.ts'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const SITE = 'https://www.sitecheckai.nl';
const LOCALES = ['nl', 'en', 'de', 'fr', 'es'];

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function findObjectBlock(source, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\n{,])\\s*(?:["']${escaped}["']|${escaped})\\s*:\\s*\\{`);
  const match = re.exec(source);
  if (!match) return null;
  const start = source.indexOf('{', match.index);
  let depth = 0;
  let quote = null;
  let escapedChar = false;
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
    const offset = remaining.indexOf(block);
    cursor += offset + block.length;
  }
  return blocks;
}

function readString(block, field) {
  const match = new RegExp(`${field}\\s*:\\s*(["'])(.*?)\\1\\s*(?:,|$)`, 's').exec(block);
  return match ? match[2].replace(/\\(["'])/g, '$1') : '';
}

function readStringArray(block, field) {
  const match = new RegExp(`${field}\\s*:\\s*\\[([\\s\\S]*?)\\]`).exec(block);
  if (!match) return [];
  return [...match[1].matchAll(/(["'])(.*?)\\1/g)].map((m) => m[2].replace(/\\(["'])/g, '$1'));
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
        points: readStringArray(localeBlock, 'points'),
        questions: readStringArray(localeBlock, 'questions'),
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
  let depth = 0;
  let quote = null;
  let escapedChar = false;
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
        points: [],
        questions: [],
      };
    }
  }
  return null;
}

function fallbackData(slug, locale) {
  const label = slug.replaceAll('-', ' ');
  const intro = locale === 'nl'
    ? 'Controleer je website met SiteCheck AI en ontdek concrete verbeterpunten.'
    : locale === 'de'
      ? 'Prüfe deine Website mit SiteCheck AI und entdecke konkrete Verbesserungen.'
      : locale === 'fr'
        ? 'Vérifiez votre site avec SiteCheck AI et découvrez des améliorations concrètes.'
        : locale === 'es'
          ? 'Comprueba tu sitio con SiteCheck AI y descubre mejoras concretas.'
          : 'Check your website with SiteCheck AI and discover practical improvements.';
  return {
    title: `${label.charAt(0).toUpperCase() + label.slice(1)} | SiteCheck AI`,
    description: intro,
    heading: label.charAt(0).toUpperCase() + label.slice(1),
    intro,
    points: [],
    questions: [],
  };
}

function faqAnswer(question, locale) {
  if (locale === 'nl') return `SiteCheck AI beantwoordt deze vraag op basis van meetbare signalen van de opgehaalde pagina: ${question}`;
  if (locale === 'de') return `SiteCheck AI beantwortet diese Frage anhand messbarer Signale der abgerufenen Seite: ${question}`;
  if (locale === 'fr') return `SiteCheck AI répond à cette question à partir des signaux mesurables de la page récupérée : ${question}`;
  if (locale === 'es') return `SiteCheck AI responde a esta pregunta a partir de señales medibles de la página obtenida: ${question}`;
  return `SiteCheck AI answers this question using measurable signals from the fetched page: ${question}`;
}

function sitemapEntry(url) {
  const escaped = url.replace(/[.*+?^\${}()|[\]\\\\]/g, '\\$&');
  const blocks = [...sitemap.matchAll(/<url>[\\s\\S]*?<\\/url>/g)].map((m) => m[0]);
  const block = blocks.find((candidate) => new RegExp(`<loc>\${escaped}</loc>`).test(candidate));
  if (!block) return [{ locale: url.split('/').filter(Boolean)[0] || 'en', href: url }];
  return [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\\s*\\/>/g)]
    .map((m) => ({ locale: m[1], href: m[2] }));
}
function jsonLd(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function replaceMeta(html, nameOrProperty, content, attribute = 'name') {
  const re = new RegExp(`<meta\\s+${attribute}=["']${nameOrProperty}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${esc(nameOrProperty)}" content="${esc(content)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `${tag}</head>`);
}

function render(templateHtml, data, locale, canonical, alternates, kind) {
  const hreflang = alternates
    .map(({ locale: lang, href }) => `<link rel="alternate" hreflang="${esc(lang)}" href="${esc(href)}">`)
    .join('');
  const cta = locale === 'nl'
    ? 'Start gratis scan'
    : locale === 'de'
      ? 'Kostenlosen Scan starten'
      : locale === 'fr'
        ? 'Lancer l’analyse gratuite'
        : locale === 'es'
          ? 'Iniciar análisis gratuito'
          : 'Start free scan';

  const points = data.points?.length
    ? `<section><h2>${locale === 'nl' ? 'Wat we controleren' : locale === 'de' ? 'Was wir prüfen' : locale === 'fr' ? 'Ce que nous vérifions' : locale === 'es' ? 'Qué comprobamos' : 'What we check'}</h2><ul>${data.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></section>`
    : '';
  const faq = data.questions?.length
    ? `<section><h2>${locale === 'nl' ? 'Veelgestelde vragen' : locale === 'de' ? 'Häufige Fragen' : locale === 'fr' ? 'Questions fréquentes' : locale === 'es' ? 'Preguntas frecuentes' : 'Frequently asked questions'}</h2>${data.questions.map((q) => `<article><h3>${esc(q)}</h3><p>${esc(faqAnswer(q, locale))}</p></article>`).join('')}</section>`
    : '';

  const body = kind === 'blog'
    ? `<main><article><p>SiteCheck AI</p><h1>${esc(data.heading)}</h1><p>${esc(data.description)}</p><p><a href="/${locale}">${cta}</a></p></article></main>`
    : `<main><article><p>SiteCheck AI</p><h1>${esc(data.heading)}</h1><p>${esc(data.intro)}</p><p>${esc(data.description)}</p>${points}${faq}<p><a href="/${locale}">${cta}</a></p></article></main>`;

  const schema = kind === 'blog'
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.heading,
        description: data.description,
        mainEntityOfPage: canonical,
        url: canonical,
        inLanguage: locale,
        author: { '@type': 'Organization', name: 'SiteCheck AI', url: SITE },
        publisher: { '@type': 'Organization', name: 'SiteCheck AI', url: SITE },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: data.title,
        description: data.description,
        url: canonical,
        inLanguage: locale,
        ...(data.questions?.length ? {
          mainEntity: data.questions.map((q) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: faqAnswer(q, locale) },
          })),
        } : {}),
      };

  let html = templateHtml
    .replace(/<html[^>]*>/i, `<html lang="${esc(locale)}">`)
    .replace(/<title>[\\s\\S]*?<\/title>/i, `<title>${esc(data.title)}</title>`)
    .replace(/<link rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<link rel=["']alternate"[^>]*hreflang=[^>]*>/gi, '')
    .replace('</head>', `<link rel="canonical" href="${esc(canonical)}">${hreflang}<script type="application/ld+json">${jsonLd(schema)}</script></head>`)
    .replace(/<div id="root">[\\s\\S]*?<\/div>/i, `<div id="root">${body}</div>`);

  html = replaceMeta(html, 'description', data.description);
  html = replaceMeta(html, 'robots', 'index, follow');
  html = replaceMeta(html, 'og:title', data.title, 'property');
  html = replaceMeta(html, 'og:description', data.description, 'property');
  html = replaceMeta(html, 'og:url', canonical, 'property');
  return html;
}

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
let generated = 0;

for (const url of urls) {
  const parts = url.replace(SITE, '').split('/').filter(Boolean);
  if (!parts.length) continue;

  const locale = parts[0];
  if (!LOCALES.includes(locale)) continue;

  const rest = parts.slice(1);
  let data;
  let kind = 'page';

  if (rest.length === 0) {
    data = {
      nl: {
        title: 'Website laten controleren? | SiteCheck AI',
        description: 'Laat je website controleren met SiteCheck AI. Ontdek SEO-, content-, techniek-, mobiel- en conversieproblemen en krijg praktische verbeteradviezen.',
        heading: 'Hoe goed presteert jouw website?',
        intro: 'SiteCheck AI analyseert je website en geeft praktische verbeteradviezen. Geen technisch rapport waar je doorheen moet ploegen, maar duidelijke handvatten voor de volgende stap.',
      },
      en: {
        title: 'Website Audit & Website Checker | SiteCheck AI',
        description: 'Check your website with SiteCheck AI. Find SEO, content, technical, mobile and conversion issues with practical improvement advice.',
        heading: 'How well does your website perform?',
        intro: 'SiteCheck AI analyzes your website and gives you practical improvement advice. No technical report to dig through — just clear guidance for what to do next.',
      },
      de: {
        title: 'Website prüfen | SiteCheck AI',
        description: 'Prüfen Sie Ihre Website mit SiteCheck AI und entdecken Sie praktische Verbesserungen für SEO, Technik, Mobile und Conversion.',
        heading: 'Wie gut funktioniert Ihre Website?',
        intro: 'SiteCheck AI analysiert Ihre Website und gibt Ihnen verständliche, praktische Hinweise für den nächsten Schritt.',
      },
      fr: {
        title: 'Analyse de site web | SiteCheck AI',
        description: 'Analysez votre site avec SiteCheck AI et découvrez des améliorations concrètes pour le SEO, la technique, le mobile et la conversion.',
        heading: 'Quelle est la performance de votre site web ?',
        intro: 'SiteCheck AI analyse votre site et vous donne des conseils pratiques et clairs pour savoir quoi améliorer ensuite.',
      },
      es: {
        title: 'Analiza tu sitio web | SiteCheck AI',
        description: 'Analiza tu sitio web con SiteCheck AI y descubre mejoras concretas de SEO, tecnología, móvil y conversión.',
        heading: '¿Qué tan bien funciona tu sitio web?',
        intro: 'SiteCheck AI analiza tu sitio web y te ofrece consejos prácticos y claros para decidir qué mejorar después.',
      },
    }[locale];
    kind = 'home';
  } else if (rest[0] === 'blog' && rest[1]) {
    data = blogData(rest[1], locale === 'nl' || locale === 'en' ? locale : 'en');
    kind = 'blog';
  } else if (rest[0] === 'blog') {
    data = locale === 'nl'
      ? {
          title: 'Website tips en SEO kennis | SiteCheck AI',
          description: 'Praktische artikelen over SEO, websites, snelheid, conversie en online vindbaarheid.',
          heading: 'Praktische kennis over websites, SEO en conversie.',
          intro: 'Heldere artikelen voor ondernemers.',
          points: [],
          questions: [],
        }
      : {
          title: 'Website & SEO Guides | SiteCheck AI',
          description: 'Practical guides about SEO, websites, speed, conversion and search visibility.',
          heading: 'Practical guides about websites, SEO and conversion.',
          intro: 'Clear guides for business owners.',
          points: [],
          questions: [],
        };
    kind = 'blog';
  } else {
    data = pageData(rest[0], locale);
  }

  if (!data?.title) data = fallbackData(rest.join('-'), locale);

  const target = path.join(dist, ...parts, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, render(template, data, locale, url, sitemapEntry(url), kind));
  generated += 1;
}

console.log(`SEO prerender: generated ${generated} static route pages.`);
