// Turns the Vite build into real HTML per language:
//   dist/index.html (vi), dist/en/index.html (en), dist/app.html (login + admin shell), dist/404.html
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://dangvykhoi.com';
const PAGES = { vi: { path: '/', url: `${SITE}/` }, en: { path: '/en', url: `${SITE}/en` } };

const seo = JSON.parse(readFileSync(join(root, 'src/content/seo.json'), 'utf8'));
const { render } = await import(pathToFileURL(join(root, 'dist-ssr/entry-server.js')).href);
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
        inLanguage: ['vi-VN', 'en'],
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
    `<link rel="alternate" hreflang="x-default" href="${PAGES.vi.url}" />`,
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

const appShell = replaceBetween(
  template,
  'head',
  `<title>Đặng Vỹ Khôi</title>\n    <meta name="robots" content="noindex, nofollow" />`,
);

const notFound = `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex" />
<title>404 | Đặng Vỹ Khôi</title>
<link rel="icon" href="/favicon.ico?v=2" />
<style>
  html, body { height: 100%; margin: 0; background: #050505; color: #fff; font-family: system-ui, sans-serif; }
  main { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; box-sizing: border-box; text-align: center; }
  h1 { font-size: 72px; margin: 0; color: #FF5C00; }
  p { margin: 0; color: #a1a1aa; line-height: 1.6; }
  a { color: #FF5C00; }
</style>
</head>
<body>
<main>
  <h1>404</h1>
  <p>Không tìm thấy trang này. / This page does not exist.</p>
  <p><a href="/">Về trang chủ</a> · <a href="/en" lang="en">Back to home</a></p>
</main>
</body>
</html>
`;

writeFileSync(join(dist, 'app.html'), appShell);
writeFileSync(join(dist, 'index.html'), page('vi'));
mkdirSync(join(dist, 'en'), { recursive: true });
writeFileSync(join(dist, 'en/index.html'), page('en'));
writeFileSync(join(dist, '404.html'), notFound);
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true });
console.log('Prerendered /, /en, app shell and 404');
