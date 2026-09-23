const fs = require('fs');
const path = require('path');

// Extract and normalize the base URL
let rawUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://ravengard.ai').trim();
if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = 'https://' + rawUrl;
}
const SITE_URL = rawUrl.replace(/\/+$/, '');

// Include all canonical public routes, explicitly excluding /interview/* and /admin/* private paths
const routes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'weekly' },
  { path: '/features', priority: '0.9', changefreq: 'weekly' },
  { path: '/projects', priority: '0.8', changefreq: 'weekly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/gateway', priority: '0.8', changefreq: 'weekly' },
  { path: '/careers', priority: '0.9', changefreq: 'daily' },
  { path: '/jobs', priority: '0.9', changefreq: 'daily' },
  { path: '/portal', priority: '0.8', changefreq: 'daily' },
  { path: '/assessment-guide', priority: '0.8', changefreq: 'weekly' }
];

function generateSitemap() {
  const currentDate = new Date().toISOString();
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (item) => `  <url>
    <loc>${SITE_URL}${item.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`Sitemap generated successfully at public/sitemap.xml for domain: ${SITE_URL}`);
}

generateSitemap();
