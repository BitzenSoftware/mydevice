// Captura de tela em ambiente serverless (Vercel).
//
// Aqui não existe processo persistente nem WebSocket, então este endpoint faz
// o que é possível em serverless: abre a URL num Chromium efêmero, com a
// emulação do aparelho pedido, devolve um PNG e encerra. É o modo de captura
// estática — a navegação ao vivo depende de um servidor de processo longo
// (ver server.js e o Dockerfile).
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const { assertPublicUrl, HARDENING_ARGS } = require('../lib/safe-url');

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

module.exports = async (req, res) => {
  const { url: rawUrl, width, height, dpr, mobile } = req.query || {};
  const w = Math.round(Number(width));
  const h = Math.round(Number(height));
  const scale = Math.min(Number(dpr) || 2, 3);
  const isMobile = mobile === '1';

  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return res.status(400).json({ error: 'URL inválida. Use http:// ou https://' });
  }
  if (!w || !h || w < 100 || h < 100 || w > 3000 || h > 3000) {
    return res.status(400).json({ error: 'Dimensões de viewport inválidas.' });
  }

  try {
    await assertPublicUrl(rawUrl);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, ...HARDENING_ARGS],
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: scale, isMobile, hasTouch: isMobile });
    await page.setUserAgent(isMobile ? MOBILE_UA : DESKTOP_UA);
    await page.goto(rawUrl, { waitUntil: 'networkidle2', timeout: 20000 });

    const buffer = await page.screenshot({ type: 'png' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (err) {
    const timedOut = /timeout/i.test(err.message || '');
    return res.status(502).json({
      error: timedOut
        ? 'O site demorou demais para responder.'
        : 'Não foi possível carregar essa URL (o site pode bloquear acesso automatizado ou não existir).',
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};
