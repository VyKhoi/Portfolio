// Turns the Vite build into real HTML per language:
//   dist/index.html (en), dist/vi/index.html (vi), dist/privacy/index.html + dist/vi/privacy/index.html,
//   dist/projects/<slug>/index.html + dist/vi/projects/<slug>/index.html, dist/app.html (login + admin shell), dist/404.html
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://dangvykhoi.com';
const PAGES = { en: { path: '/', url: `${SITE}/` }, vi: { path: '/vi', url: `${SITE}/vi` } };

const seo = JSON.parse(readFileSync(join(root, 'src/content/seo.json'), 'utf8'));
const { render, renderNotFound, PRIVACY, PRIVACY_PATH, PROJECTS, projectPath } = await import(pathToFileURL(join(root, 'dist-ssr/entry-server.js')).href);
const template = readFileSync(join(dist, 'index.html'), 'utf8');

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fonts = readdirSync(join(dist, 'assets')).filter((f) => /^(space-grotesk|urbanist)-latin-wght-normal.*\.woff2$/.test(f));

function replaceBetween(html, name, content) {
  const re = new RegExp(`<!--${name}:start-->[\\s\\S]*?<!--${name}:end-->`);
  if (!re.test(html)) throw new Error(`Marker ${name} missing in index.html`);
  return html.replace(re, () => content);
}

function jsonLd(lang) {
  const s = seo[lang];
  const page = PAGES[lang].url;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE}/#person`,
        name: 'Đặng Vỹ Khôi',
        givenName: 'Khôi',
        additionalName: 'Vỹ',
        familyName: 'Đặng',
        alternateName: ['Dang Vy Khoi', 'Vỹ Khôi Đặng', 'Vy Khoi Dang', 'dangvykhoi'],
        disambiguatingDescription: s.disambiguating,
        description: s.person,
        url: SITE,
        image: `${SITE}/profile.jpg`,
        jobTitle: 'Software Engineer',
        alumniOf: { '@type': 'EducationalOrganization', name: 'Trường Đại học Mở Thành phố Hồ Chí Minh (HCMCOU)' },
        address: { '@type': 'PostalAddress', addressLocality: 'Gò Vấp', addressRegion: 'Hồ Chí Minh', addressCountry: 'VN' },
        sameAs: ['https://github.com/vykhoi', 'https://linkedin.com/in/vykhoi'],
        knowsAbout: ['C#', '.NET', 'ASP.NET Core', 'PostgreSQL', 'SQL Server', 'Docker'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: 'Đặng Vỹ Khôi',
        publisher: { '@id': `${SITE}/#person` },
        inLanguage: ['en', 'vi-VN'],
      },
      {
        '@type': 'ProfilePage',
        '@id': `${page}#profilepage`,
        url: page,
        name: s.title,
        inLanguage: s.inLanguage,
        mainEntity: { '@id': `${SITE}/#person` },
      },
    ],
  }).replace(/</g, '\\u003c');
}

function head(lang) {
  const s = seo[lang];
  const page = PAGES[lang].url;
  const other = lang === 'vi' ? 'en' : 'vi';
  const image = `${SITE}/${s.ogImage}`;
  return [
    `<title>${escapeAttr(s.title)}</title>`,
    `<meta name="description" content="${escapeAttr(s.description)}" />`,
    `<meta name="author" content="Đặng Vỹ Khôi" />`,
    `<link rel="canonical" href="${page}" />`,
    `<link rel="alternate" hreflang="vi" href="${PAGES.vi.url}" />`,
    `<link rel="alternate" hreflang="en" href="${PAGES.en.url}" />`,
    `<link rel="alternate" hreflang="x-default" href="${PAGES.en.url}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="Đặng Vỹ Khôi" />`,
    `<meta property="og:url" content="${page}" />`,
    `<meta property="og:title" content="${escapeAttr(s.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(s.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeAttr(s.ogImageAlt)}" />`,
    `<meta property="og:locale" content="${s.locale}" />`,
    `<meta property="og:locale:alternate" content="${seo[other].locale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(s.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(s.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<link rel="preload" as="image" type="image/webp" href="/profile-400.webp" imagesrcset="/profile-400.webp 400w, /profile-800.webp 800w" imagesizes="(min-width: 768px) 400px, 270px" fetchpriority="high" />`,
    ...fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`),
    `<script type="application/ld+json">${jsonLd(lang)}</script>`,
    // Scroll-in animations start hidden; without JS nothing would ever reveal them
    `<noscript><style>#root [style*="opacity"] { opacity: 1 !important; transform: none !important; }</style></noscript>`,
  ].join('\n    ');
}

// The stylesheet is small and this is a one-page site: inlining saves a blocking round trip
function inlineCss(html) {
  return html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/, (_, file) => `<style>${readFileSync(join(dist, file), 'utf8')}</style>`);
}

function page(lang) {
  let html = template.replace('<html lang="vi">', `<html lang="${lang}">`);
  html = replaceBetween(html, 'head', head(lang));
  html = replaceBetween(html, 'app', render(PAGES[lang].path));
  return inlineCss(html).replace('<div id="root">', '<div id="root" data-prerendered="true">');
}

// Privacy policy: plain head, no JSON-LD or image preloads
function privacyPage(lang) {
  const p = PRIVACY[lang];
  const url = (l) => `${SITE}${PRIVACY_PATH[l]}`;
  const title = `${p.title} | Đặng Vỹ Khôi`;
  const headHtml = [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(p.description)}" />`,
    `<link rel="canonical" href="${url(lang)}" />`,
    `<link rel="alternate" hreflang="vi" href="${url('vi')}" />`,
    `<link rel="alternate" hreflang="en" href="${url('en')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${url('en')}" />`,
    ...fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`),
  ].join('\n    ');
  let html = template.replace('<html lang="vi">', `<html lang="${lang}">`);
  html = replaceBetween(html, 'head', headHtml);
  html = replaceBetween(html, 'app', render(PRIVACY_PATH[lang]));
  return inlineCss(html).replace('<div id="root">', '<div id="root" data-prerendered="true">');
}

// Project pages: own title, description, share image and breadcrumb
function projectPage(project, lang) {
  const c = project.copy[lang];
  const url = (l) => `${SITE}${projectPath(project.slug, l)}`;
  const image = `${SITE}${project.ogImage[lang]}`;
  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Đặng Vỹ Khôi', item: PAGES[lang].url },
          { '@type': 'ListItem', position: 2, name: c.name, item: url(lang) },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${url(lang)}#webpage`,
        url: url(lang),
        name: c.seoTitle,
        description: c.seoDescription,
        inLanguage: seo[lang].inLanguage,
        isPartOf: { '@id': `${SITE}/#website` },
        primaryImageOfPage: `${SITE}${project.image[lang].split('?')[0]}`,
        about: { '@id': `${project.url.en}#product` },
      },
      {
        '@type': project.schemaType,
        '@id': `${project.url.en}#product`,
        name: c.name,
        url: project.url[lang],
        description: c.summary,
        author: { '@type': 'Person', '@id': `${SITE}/#person`, name: 'Đặng Vỹ Khôi', url: SITE },
        ...(project.schemaType === 'WebApplication'
          ? { applicationCategory: 'ProductivityApplication', operatingSystem: 'Web', isAccessibleForFree: true }
          : {}),
      },
    ],
  }).replace(/</g, '\\u003c');
  const headHtml = [
    `<title>${escapeAttr(c.seoTitle)}</title>`,
    `<meta name="description" content="${escapeAttr(c.seoDescription)}" />`,
    `<meta name="author" content="Đặng Vỹ Khôi" />`,
    `<link rel="canonical" href="${url(lang)}" />`,
    `<link rel="alternate" hreflang="vi" href="${url('vi')}" />`,
    `<link rel="alternate" hreflang="en" href="${url('en')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${url('en')}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Đặng Vỹ Khôi" />`,
    `<meta property="og:url" content="${url(lang)}" />`,
    `<meta property="og:title" content="${escapeAttr(c.seoTitle)}" />`,
    `<meta property="og:description" content="${escapeAttr(c.seoDescription)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeAttr(c.imageAlt)}" />`,
    `<meta property="og:locale" content="${seo[lang].locale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(c.seoTitle)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(c.seoDescription)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<link rel="preload" as="image" type="image/webp" href="${project.image[lang]}" fetchpriority="high" />`,
    ...fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`),
    `<script type="application/ld+json">${breadcrumb}</script>`,
    `<noscript><style>#root [style*="opacity"] { opacity: 1 !important; transform: none !important; }</style></noscript>`,
  ].join('\n    ');
  let html = template.replace('<html lang="vi">', `<html lang="${lang}">`);
  html = replaceBetween(html, 'head', headHtml);
  html = replaceBetween(html, 'app', render(projectPath(project.slug, lang)));
  return inlineCss(html).replace('<div id="root">', '<div id="root" data-prerendered="true">');
}

const appShell =replaceBetween(
  template,
  'head',
  `<title>Đặng Vỹ Khôi</title>\n    <meta name="robots" content="noindex, nofollow" />`,
);

// 404: same look as the site, but static. Without the app bundle the router cannot redirect
// the unknown URL away, so the visitor actually sees this page.
function notFoundPage() {
  const headHtml = [
    `<title>404 | Đặng Vỹ Khôi</title>`,
    `<meta name="robots" content="noindex" />`,
    ...fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`),
  ].join('\n    ');
  let html = template.replace('<html lang="vi">', '<html lang="en">');
  html = replaceBetween(html, 'head', headHtml);
  html = replaceBetween(html, 'app', renderNotFound());
  html = html.replace(/<script type="module"[^>]*><\/script>\s*/g, '').replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
  if (/<script type="module"/.test(html)) throw new Error('404 page still loads the app bundle');
  return inlineCss(html);
}

writeFileSync(join(dist, 'app.html'), appShell);
writeFileSync(join(dist, 'index.html'), page('en'));
mkdirSync(join(dist, 'vi'), { recursive: true });
writeFileSync(join(dist, 'vi/index.html'), page('vi'));
for (const lang of ['en', 'vi']) {
  const dir = join(dist, PRIVACY_PATH[lang].slice(1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), privacyPage(lang));
}
for (const project of PROJECTS) {
  for (const lang of ['en', 'vi']) {
    const dir = join(dist, projectPath(project.slug, lang).slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), projectPage(project, lang));
  }
}
writeFileSync(join(dist, '404.html'), notFoundPage());

// What this build was made from, exactly as the API returned it at build time. The admin console compares it with
// the live API to show "published" or "waiting for the next publish"; scripts/publish-content.sh does the same.
const portfolio = JSON.parse(readFileSync(join(root, 'src/content/portfolio.json'), 'utf8'));
writeFileSync(
  join(dist, 'content-snapshot.json'),
  JSON.stringify({
    builtAt: new Date().toISOString(),
    content: { ...portfolio, projects: JSON.parse(readFileSync(join(root, 'src/content/projects.json'), 'utf8')) },
  }),
);

// Sitemap from the same page list, so a new page can never be forgotten; lastmod = this build (deploys only happen on changes)
const today = new Date().toISOString().slice(0, 10);
const pairs = [
  { en: '/', vi: '/vi' },
  { en: PRIVACY_PATH.en, vi: PRIVACY_PATH.vi },
  ...PROJECTS.map((p) => ({ en: projectPath(p.slug, 'en'), vi: projectPath(p.slug, 'vi') })),
];
const sitemapUrl = (path, pair) => `  <url>
    <loc>${SITE}${path}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${pair.en}" />
    <xhtml:link rel="alternate" hreflang="vi" href="${SITE}${pair.vi}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pair.en}" />
  </url>`;
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pairs.flatMap((pair) => [sitemapUrl(pair.en, pair), sitemapUrl(pair.vi, pair)]).join('\n')}
</urlset>
`,
);
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true });
console.log(`Prerendered /, /vi, /privacy, /vi/privacy, ${PROJECTS.length * 2} project pages, app shell, 404 and sitemap (${pairs.length * 2} urls)`);
