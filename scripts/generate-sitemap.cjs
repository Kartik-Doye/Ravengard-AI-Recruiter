const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://' + (process.env.VITE_APP_URL || 'example.com');

// Include public routes, explicitly excluding /interview/* and other dynamic private paths
const routes = [
  '/',
  '/projects',
  '/about',
  '/contact',
  '/gateway'
];

function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map((route) => {
      return `
    <url>
      <loc>${SITE_URL}${route}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${route === '/' ? '1.0' : '0.8'}</priority>
    </url>
      `.trim();
    })
    .join('\n  ')}
</urlset>
`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log('Sitemap generated at public/sitemap.xml');
}

generateSitemap();
