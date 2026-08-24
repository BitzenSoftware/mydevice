// Captura de tela em ambiente serverless (Vercel).
//
// Aqui não existe processo persistente nem WebSocket, então este endpoint faz
// o que é possível em serverless: abre a URL num Chromium efêmero, com a
// emulação do aparelho pedido, devolve um PNG e encerra. É o modo de captura
// estática — a navegação ao vivo depende de um servidor de processo longo
// (ver server.js e o Dockerfile).
// Nada de require pesado no escopo do módulo: se algo falhar ali, a invocação
// morre antes de qualquer tratamento e o cliente recebe um 500 mudo, sem pista
// nenhuma. Tudo é carregado dentro do handler, sob try/catch.
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// Responde sempre em JSON com um `code`, para que uma falha possa ser
// diagnosticada pelo navegador mesmo sem acesso aos logs da plataforma.
const fail = (res, status, code, message, detail) => {
  console.error(`[screenshot] ${code}: ${detail || message}`);
  return res.status(status).json({ code, error: message, detail: detail || undefined });
};

module.exports = async (req, res) => {
  try {
    return await handle(req, res);
  } catch (err) {
    // Rede de segurança: qualquer coisa não prevista ainda vira JSON legível.
    return fail(res, 500, 'handler-crash', 'Erro inesperado no servidor de captura.', err && err.message);
  }
};

async function handle(req, res) {
  let puppeteer, assertPublicUrl, HARDENING_ARGS;
  try {
    puppeteer = require('puppeteer-core');
    ({ assertPublicUrl, HARDENING_ARGS } = require('../lib/safe-url'));
  } catch (err) {
    return fail(res, 500, 'deps-missing', 'Dependências do servidor de captura ausentes.', err.message);
  }

  const { url: rawUrl, width, height, dpr, mobile } = req.query || {};
  const w = Math.round(Number(width));
  const h = Math.round(Number(height));
  const scale = Math.min(Number(dpr) || 2, 3);
  const isMobile = mobile === '1';

  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return fail(res, 400, 'bad-url', 'URL inválida. Use http:// ou https://');
  }
  if (!w || !h || w < 100 || h < 100 || w > 3000 || h > 3000) {
    return fail(res, 400, 'bad-viewport', 'Dimensões de viewport inválidas.');
  }

  try {
    await assertPublicUrl(rawUrl);
  } catch (err) {
    return fail(res, 400, 'blocked', err.message);
  }

  // O require fica aqui dentro: se o pacote do Chromium não tiver sido
  // empacotado junto com a função, o erro vira uma resposta JSON legível em
  // vez de derrubar a invocação inteira antes de qualquer tratamento.
  // O pacote é ESM, então em CommonJS o objeto real vem em `.default`.
  let chromium;
  try {
    const mod = require('@sparticuz/chromium');
    chromium = mod.default || mod;
    if (!Array.isArray(chromium.args)) throw new Error('API inesperada do @sparticuz/chromium');
  } catch (err) {
    return fail(res, 500, 'chromium-missing',
      'O componente de captura não está disponível nesta instalação.', err.message);
  }

  let browser;
  try {
    // A pilha gráfica (WebGL/swiftshader) é pesada e desnecessária para tirar
    // uma foto da página; desligá-la evita extrair um arquivo grande a cada
    // invocação fria.
    chromium.setGraphicsMode = false;

    // Este pacote embarca o binário headless-shell, que não implementa o modo
    // "new" do Chrome — daí o headless: 'shell' em ambos os lugares.
    const args = await puppeteer.defaultArgs({
      args: [...chromium.args, ...HARDENING_ARGS],
      headless: 'shell',
    });

    browser = await puppeteer.launch({
      args,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  } catch (err) {
    return fail(res, 500, 'browser-launch-failed',
      'Não foi possível iniciar o componente de captura.', err.message);
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: scale, isMobile, hasTouch: isMobile });
    await page.setUserAgent(isMobile ? MOBILE_UA : DESKTOP_UA);
    await page.goto(rawUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

    // networkidle costuma estourar o tempo da função em sites com conexões
    // longas (analytics, websockets), então esperamos um respiro curto.
    await new Promise(r => setTimeout(r, 1200));

    const buffer = await page.screenshot({ type: 'png' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (err) {
    const timedOut = /timeout|timed out/i.test(err.message || '');
    return fail(res, 502, timedOut ? 'navigation-timeout' : 'navigation-failed',
      timedOut
        ? 'O site demorou demais para responder.'
        : 'Não foi possível carregar essa URL (o site pode bloquear acesso automatizado ou não existir).',
      err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
