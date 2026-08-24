// Gera a pasta dist/ que a Vercel publica.
//
// As páginas trazem marcadores ({{CANONICAL}}, blocos de anúncio, configuração
// de runtime) que o servidor Express resolve em tempo de requisição. Na Vercel
// não há servidor para isso, então resolvemos na build e publicamos HTML puro
// — que é inclusive melhor para buscadores e rastreadores de IA.
const fs = require('fs');
const path = require('path');
const { PUBLIC_DIR, renderPage, robotsTxt, llmsTxt, sitemapXml, adsTxt } = require('../lib/site-content');

const DIST = path.join(__dirname, '..', 'dist');

// Na Vercel, VERCEL_PROJECT_PRODUCTION_URL traz o domínio de produção sem o
// esquema. PUBLIC_URL tem prioridade, para quando houver domínio próprio.
const publicUrl = (
  process.env.PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
).replace(/\/+$/, '');

const adsenseClient = (process.env.ADSENSE_CLIENT || '').trim();

// Sem motor de navegação ao vivo configurado, a interface usa captura estática.
const liveEngine = (process.env.LIVE_ENGINE_URL || '').trim() || null;

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const opts = {
  publicUrl,
  adsenseClient,
  slot1: process.env.ADSENSE_SLOT_1 || '',
  slot2: process.env.ADSENSE_SLOT_2 || '',
  liveEngine,
};

// Páginas HTML com os marcadores resolvidos
fs.writeFileSync(path.join(DIST, 'index.html'), renderPage('index.html', opts));
fs.mkdirSync(path.join(DIST, 'privacidade'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'privacidade', 'index.html'), renderPage('privacidade.html', opts));

// Estáticos copiados como estão
for (const file of ['app.js', 'style.css']) {
  fs.copyFileSync(path.join(PUBLIC_DIR, file), path.join(DIST, file));
}

// Arquivos gerados
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt(publicUrl));
fs.writeFileSync(path.join(DIST, 'llms.txt'), llmsTxt(publicUrl, liveEngine !== null));
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml(publicUrl));

const ads = adsTxt(adsenseClient);
if (ads) fs.writeFileSync(path.join(DIST, 'ads.txt'), ads);

console.log(`dist/ gerada`);
console.log(`  domínio canônico : ${publicUrl || '(vazio — defina PUBLIC_URL)'}`);
console.log(`  navegação ao vivo: ${liveEngine || 'desligada (modo captura estática)'}`);
console.log(`  adsense          : ${adsenseClient || 'não configurado'}`);
