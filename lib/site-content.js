const fs = require('fs');
const path = require('path');

// Conteúdo do site gerado num só lugar, para que o servidor Express (local e
// Render) e a build estática da Vercel produzam exatamente as mesmas páginas.

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const adsenseHead = client => client
  ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>`
  : '';

// Sem client configurado o bloco sai vazio (o CSS esconde slots vazios), então
// nada de espaço reservado sobrando enquanto a conta não está aprovada.
const adSlot = (client, slot) => client
  ? `<div class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`
  : '';

// liveEngine: endereço do motor de navegação ao vivo.
//   ''    -> mesmo servidor que entregou a página (local e Render)
//   null  -> não existe motor; a interface cai no modo de captura estática
const runtimeConfig = liveEngine =>
  `<script>window.__MYDEVICE__=${JSON.stringify({ liveEngine })};</script>`;

// A página descreve a ferramenta, e o que ela faz depende de haver motor de
// navegação ao vivo. Prometer interatividade onde só existe captura estática
// seria enganar o visitante, então os trechos que dependem do modo ficam entre
// {{IF_LIVE}}...{{/IF_LIVE}} e {{IF_STATIC}}...{{/IF_STATIC}}.
function applyConditionals(html, isLive) {
  const keep = /\{\{(IF_LIVE|IF_STATIC)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  return html.replace(keep, (_all, tag, body) =>
    (tag === 'IF_LIVE') === isLive ? body : ''
  );
}

function renderPage(file, opts = {}) {
  const { publicUrl = '', adsenseClient = '', slot1 = '', slot2 = '', liveEngine = '' } = opts;
  const isLive = liveEngine !== null && liveEngine !== undefined;
  return applyConditionals(fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8'), isLive)
    .replace(/\{\{CANONICAL\}\}/g, publicUrl)
    .replace(/\{\{ADSENSE_HEAD\}\}/g, adsenseHead(adsenseClient))
    .replace(/\{\{RUNTIME_CONFIG\}\}/g, runtimeConfig(liveEngine))
    .replace(/\{\{AD_SLOT_1\}\}/g, adSlot(adsenseClient, slot1))
    .replace(/\{\{AD_SLOT_2\}\}/g, adSlot(adsenseClient, slot2));
}

// Rastreadores de IA são liberados explicitamente: a proposta é que o conteúdo
// seja legível por assistentes, não só por buscadores tradicionais.
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot', 'Applebot-Extended',
  'CCBot', 'Amazonbot', 'Bytespider', 'meta-externalagent', 'cohere-ai',
  'DuckAssistBot', 'MistralAI-User', 'YouBot', 'Diffbot', 'Timpibot',
];

const robotsTxt = publicUrl => [
  '# mydevice — leitura liberada para buscadores e assistentes de IA',
  ...AI_BOTS.flatMap(bot => [`User-agent: ${bot}`, 'Allow: /', '']),
  'User-agent: *',
  'Allow: /',
  'Disallow: /ws/',
  'Disallow: /api/',
  'Disallow: /health',
  '',
  `Sitemap: ${publicUrl}/sitemap.xml`,
  '',
].join('\n');

const llmsTxt = (publicUrl, isLive = true) => `# mydevice

> Ferramenta web gratuita que abre qualquer site dentro de molduras realistas de
> celular, tablet e desktop, e exporta o resultado como PNG de fundo
> transparente.

## O que a ferramenta faz

- Abre uma URL pública dentro da moldura do aparelho escolhido.
- Emula o aparelho de verdade (user-agent móvel, toque e viewport), então PWAs e
  sites responsivos entregam o layout móvel correto.
- Funciona com sites que bloqueiam incorporação via iframe, porque a página é
  aberta num navegador no servidor e não embutida no navegador do visitante.
- Exporta o resultado em PNG com fundo transparente, contendo apenas o aparelho.
${isLive
  ? '- O site fica navegável dentro da moldura: aceita cliques, rolagem,\n  digitação e troca de telas.'
  : '- Nesta instalação a tela é uma captura estática: dá para escolher aparelho,\n  trocar a cor e baixar a imagem, mas não para clicar ou rolar dentro dela.'}

## Aparelhos disponíveis

Celulares: iPhone 15 Pro (393x852), iPhone SE (375x667),
Samsung Galaxy S23 (360x780), Google Pixel 8 (412x915).
Tablets: iPad Pro 11" (834x1194), iPad Mini (744x1133), Galaxy Tab S9 (800x1280).
Desktop: MacBook Pro 14" (1440x900), Monitor/iMac (1600x900),
Janela do Navegador (1280x800).

Cada moldura tem cor personalizável, com predefinições e seletor livre.

## Limites

- Só abre endereços públicos. Endereços internos (localhost, redes privadas,
  link-local e metadados de nuvem) são recusados por segurança.
- Não é indicado para acessar sistemas com dados sensíveis, porque o conteúdo
  passa pelo servidor para poder ser exibido.

## Páginas

- [Início](${publicUrl}/): a ferramenta e a documentação de uso.
- [Política de privacidade](${publicUrl}/privacidade): tratamento de dados,
  cookies e publicidade.
`;

const sitemapXml = publicUrl => {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${publicUrl}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${publicUrl}/privacidade</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
`;
};

// Exigido pelo AdSense para autorizar quem pode vender o inventário do domínio.
const adsTxt = client => client
  ? `google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
  : null;

module.exports = { PUBLIC_DIR, renderPage, robotsTxt, llmsTxt, sitemapXml, adsTxt };
