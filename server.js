const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
// puppeteer-core é ESM: require() dele só funciona a partir do Node 22.12.
// Carregar por import() dinâmico mantém o servidor rodando em qualquer versão.
const puppeteerPromise = import('puppeteer-core').then(m => m.default);
const fs = require('fs');
const path = require('path');
const { assertPublicUrl, HARDENING_ARGS } = require('./lib/safe-url');
const site = require('./lib/site-content');
const { profileFor, applyDeviceProfile, emulateStandalone } = require('./lib/device-profiles');

const app = express();
const PORT = process.env.PORT || 5177;

// Tipos de quadro no protocolo binário (primeiro byte da mensagem)
const FRAME_LIVE = 1;   // screencast 1x — rápido, usado enquanto o usuário interage
const FRAME_SHARP = 2;  // screenshot em alta resolução — usado quando a tela está parada
const FRAME_SHOT = 3;   // PNG da captura pedida pelo botão de download

const IDLE_AFTER_MS = 300;      // tempo sem interação até começar a mandar quadros nítidos
const SHARP_EVERY_MS = 700;     // intervalo entre quadros nítidos enquanto está parado
const SHARP_TIMEOUT_MS = 3000;  // desiste de uma captura nítida travada
const MAX_BUFFERED_BYTES = 2 * 1024 * 1024; // se o socket entupir, pula quadros

// Reusa um Chrome/Chromium já instalado em vez de baixar outro: no contêiner
// vem do pacote do sistema, no Windows do Chrome/Edge do próprio usuário.
const CANDIDATE_BROWSERS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);

function findBrowser() {
  for (const candidate of CANDIDATE_BROWSERS) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const executablePath = findBrowser();
if (!executablePath) {
  console.error('Nenhum navegador Chrome ou Edge encontrado nos caminhos padrão.');
  process.exit(1);
}

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteerPromise.then(puppeteer => puppeteer.launch({
      executablePath,
      headless: true,
      args: HARDENING_ARGS,
    }));
    browserPromise.catch(() => { browserPromise = null; });
  }
  return browserPromise;
}

// ---------- Páginas, SEO e leitura por IA ----------
// O conteúdo do site fica em HTML de verdade, sem depender de JavaScript, para
// que buscadores e rastreadores de IA consigam ler. A geração é compartilhada
// com a build estática da Vercel (lib/site-content.js), para as duas hospedagens
// produzirem exatamente as mesmas páginas.
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const ADSENSE_CLIENT = (process.env.ADSENSE_CLIENT || '').trim();

const pageOpts = {
  publicUrl: PUBLIC_URL,
  adsenseClient: ADSENSE_CLIENT,
  slot1: process.env.ADSENSE_SLOT_1 || '',
  slot2: process.env.ADSENSE_SLOT_2 || '',
  liveEngine: '', // mesmo servidor: aqui a navegação ao vivo está disponível
};

app.get('/', (_req, res) => res.type('html').send(site.renderPage('index.html', pageOpts)));
app.get('/privacidade', (_req, res) => res.type('html').send(site.renderPage('privacidade.html', pageOpts)));

// index: false para que a rota acima trate a home em vez do arquivo cru
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('/robots.txt', (_req, res) => res.type('text/plain').send(site.robotsTxt(PUBLIC_URL)));
app.get('/llms.txt', (_req, res) => res.type('text/plain').send(site.llmsTxt(PUBLIC_URL)));
app.get('/sitemap.xml', (_req, res) => res.type('application/xml').send(site.sitemapXml(PUBLIC_URL)));
app.get('/ads.txt', (_req, res) => {
  const body = site.adsTxt(ADSENSE_CLIENT);
  return body ? res.type('text/plain').send(body) : res.status(404).type('text/plain').send('');
});


// Mesmo endpoint da função serverless (api/screenshot.js), para que os dois
// ambientes se comportem igual e o modo de captura estática possa ser testado
// aqui também.
app.get('/api/screenshot', async (req, res) => {
  const rawUrl = req.query.url;
  const w = Math.round(Number(req.query.width));
  const h = Math.round(Number(req.query.height));
  const scale = Math.min(Number(req.query.dpr) || 2, 3);
  const isMobile = req.query.mobile === '1';
  const profile = profileFor(req.query.os);
  const standalone = req.query.standalone === '1';

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

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: scale, isMobile, hasTouch: isMobile });
    const shotClient = await page.createCDPSession();
    await applyDeviceProfile(shotClient, profile);
    if (standalone) await emulateStandalone(page);
    await page.goto(rawUrl, { waitUntil: 'networkidle2', timeout: 20000 });
    const buffer = await page.screenshot({ type: 'png' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (err) {
    const timedOut = /timeout/i.test(err.message || '');
    res.status(502).json({
      error: timedOut
        ? 'O site demorou demais para responder.'
        : 'Não foi possível carregar essa URL (o site pode bloquear acesso automatizado ou não existir).',
    });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

// Cada sessão mantém uma aba de Chrome viva; sem teto, visitas simultâneas
// esgotariam a memória do contêiner.
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS || 6);
let activeSessions = 0;

// ---------- Sessão remota ao vivo ----------
// O site roda de verdade num Chrome headless com a emulação do dispositivo
// escolhido (user-agent mobile, toque, viewport), então PWAs reconhecem
// corretamente que estão num celular. Como nada é embutido no navegador do
// usuário, também funciona em sites que bloqueiam iframe.
//
// A transmissão é HÍBRIDA, porque nenhum método sozinho serve:
//   - Page.startScreencast é rápido (~15fps) mas o Chrome headless ignora o
//     deviceScaleFactor e sempre entrega 1x — fica borrado numa tela HiDPI.
//   - page.screenshot respeita o DPR (nítido) mas leva ~105ms por quadro,
//     ou seja no máximo ~10fps: navegar com ele fica lento demais.
// Então: enquanto o usuário interage, manda screencast (fluido); assim que ele
// para, manda quadros em alta resolução (nítido). O melhor dos dois.
const wss = new WebSocketServer({ server, path: '/ws/session' });

wss.on('connection', async (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const rawUrl = params.get('url');
  const width = Math.round(Number(params.get('width')));
  const height = Math.round(Number(params.get('height')));
  const dpr = Math.min(Number(params.get('dpr')) || 2, 3);
  const mobile = params.get('mobile') === '1';
  const profile = profileFor(params.get('os'));
  const standalone = params.get('standalone') === '1';

  if (!rawUrl || !/^https?:\/\//i.test(rawUrl) || !width || !height || width < 100 || height < 100) {
    ws.send(JSON.stringify({ t: 'error', message: 'Parâmetros inválidos.' }));
    ws.close();
    return;
  }

  try {
    await assertPublicUrl(rawUrl);
  } catch (err) {
    ws.send(JSON.stringify({ t: 'error', message: err.message }));
    ws.close();
    return;
  }

  if (activeSessions >= MAX_SESSIONS) {
    ws.send(JSON.stringify({ t: 'error', message: 'O servidor está com todas as sessões ocupadas. Tente de novo em instantes.' }));
    ws.close();
    return;
  }
  activeSessions++;

  let page = null;
  let client = null;
  let closed = false;
  let sharpTimer = null;

  // Começa como se o usuário tivesse acabado de interagir: assim o primeiro
  // desenho da tela vem pelo caminho rápido (importante no cold start, quando
  // o Chrome ainda está subindo) e só depois assume o modo nítido.
  let lastInputAt = Date.now();
  let lastSharpAt = 0;     // último quadro nítido enviado
  let shotInFlight = false;
  let screencastOn = false;

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    activeSessions--;
    if (sharpTimer) clearInterval(sharpTimer);
    try { if (page) await page.close(); } catch {}
  };

  // Registrado já, antes de qualquer await da inicialização: se o visitante
  // fechar a aba enquanto o navegador ainda está subindo, a limpeza precisa
  // acontecer mesmo assim — senão a vaga fica presa e, depois de algumas
  // visitas, o servidor passa a recusar todo mundo.
  ws.on('close', cleanup);
  ws.on('error', cleanup);

  const sendFrame = (type, buffer) => {
    if (closed || ws.readyState !== ws.OPEN) return;
    if (type !== FRAME_SHOT && ws.bufferedAmount > MAX_BUFFERED_BYTES) return; // socket entupido: descarta
    ws.send(Buffer.concat([Buffer.from([type]), buffer]));
  };

  // O screencast só roda enquanto o usuário está interagindo. Parado, ele é
  // desligado e a tela passa a ser enviada só em alta resolução — senão uma
  // página que se atualiza sozinha (um relógio, por exemplo) ficaria mandando
  // quadros 1x sem parar e apagando os nítidos, deixando tudo borrado.
  const startScreencast = async () => {
    if (screencastOn || closed) return;
    screencastOn = true;
    try {
      await client.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 70, // baixa de propósito: é o modo "em movimento", o nítido vem depois
        maxWidth: width,
        maxHeight: height,
        everyNthFrame: 1,
      });
    } catch { screencastOn = false; }
  };

  const stopScreencast = async () => {
    if (!screencastOn || closed) return;
    screencastOn = false;
    try { await client.send('Page.stopScreencast'); } catch {}
  };

  // Captura em alta resolução, com prazo — se travar (navegação em andamento,
  // por exemplo) a gente desiste dela em vez de congelar a transmissão.
  const takeSharp = async (type = FRAME_SHARP, format = 'jpeg') => {
    if (closed) return;
    // Quadro nítido de rotina: se já tem uma captura rolando, pula essa vez.
    // Já a captura do botão de download não pode ser descartada — espera a vez.
    if (type === FRAME_SHARP && shotInFlight) return;
    while (shotInFlight && !closed) await new Promise(r => setTimeout(r, 25));
    if (closed) return;
    shotInFlight = true;
    const opts = format === 'png' ? { type: 'png' } : { type: 'jpeg', quality: 92 };
    const shot = page.screenshot(opts).catch(() => null);
    const buffer = await Promise.race([
      shot,
      new Promise(resolve => setTimeout(() => resolve(null), SHARP_TIMEOUT_MS)),
    ]);
    shotInFlight = false;
    if (buffer) {
      lastSharpAt = Date.now();
      sendFrame(type, buffer);
    } else if (type === FRAME_SHOT && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ t: 'capture-error', message: 'Falha ao gerar a captura para download.' }));
    }
  };

  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });

    client = await page.createCDPSession();
    await applyDeviceProfile(client, profile);
    if (standalone) await emulateStandalone(page);

    client.on('Page.screencastFrame', async ({ data, sessionId }) => {
      sendFrame(FRAME_LIVE, Buffer.from(data, 'base64'));
      try { await client.send('Page.screencastFrameAck', { sessionId }); } catch {}
    });

    await startScreencast();

    // Enquanto o usuário não está mexendo, vai reenviando a tela em alta
    // resolução. Isso também mantém nítida uma tela que se atualiza sozinha
    // (um relógio rodando, por exemplo), sem atrapalhar a navegação.
    sharpTimer = setInterval(() => {
      if (closed || shotInFlight) return;
      const now = Date.now();
      if (now - lastInputAt < IDLE_AFTER_MS) return;
      if (screencastOn) stopScreencast();
      if (now - lastSharpAt < SHARP_EVERY_MS) return;
      takeSharp(FRAME_SHARP, 'png');
    }, 120);

    ws.send(JSON.stringify({ t: 'ready' }));

    page.goto(rawUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
      .catch(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ t: 'error', message: 'Não foi possível abrir essa URL.' }));
        }
      });
  } catch (err) {
    console.error('Erro ao iniciar sessão remota:', err.message);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ t: 'error', message: 'Não foi possível iniciar a sessão.' }));
    }
    await cleanup();
    return;
  }

  ws.on('message', async raw => {
    if (closed || !client) return;
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.t !== 'capture') {
      lastInputAt = Date.now();
      if (!screencastOn) startScreencast(); // voltou a interagir: religa o modo fluido
    }

    try {
      if (msg.t === 'touch') {
        const type = { start: 'touchStart', move: 'touchMove', end: 'touchEnd' }[msg.phase];
        if (!type) return;
        const touchPoints = msg.phase === 'end' ? [] : [{ x: msg.x, y: msg.y }];
        await client.send('Input.dispatchTouchEvent', { type, touchPoints });
      } else if (msg.t === 'mouse') {
        const type = { down: 'mousePressed', move: 'mouseMoved', up: 'mouseReleased' }[msg.phase];
        if (!type) return;
        await client.send('Input.dispatchMouseEvent', {
          type, x: msg.x, y: msg.y, button: 'left', clickCount: msg.phase === 'down' ? 1 : 0,
        });
      } else if (msg.t === 'wheel') {
        await client.send('Input.dispatchMouseEvent', {
          type: 'mouseWheel', x: msg.x, y: msg.y, deltaX: msg.deltaX, deltaY: msg.deltaY,
        });
      } else if (msg.t === 'text') {
        await client.send('Input.insertText', { text: msg.text });
      } else if (msg.t === 'key') {
        const type = msg.phase === 'up' ? 'keyUp' : 'keyDown';
        await client.send('Input.dispatchKeyEvent', {
          type, key: msg.key, code: msg.code, windowsVirtualKeyCode: msg.keyCode, nativeVirtualKeyCode: msg.keyCode,
        });
      } else if (msg.t === 'capture') {
        // PNG da MESMA página que está sendo navegada (inclusive telas pra onde
        // o usuário navegou), não uma nova aba recarregada do zero.
        await takeSharp(FRAME_SHOT, 'png');
      }
    } catch {
      // sessão pode já ter fechado; ignora
    }
  });

});

server.listen(PORT, () => {
  console.log(`mydevice rodando em http://localhost:${PORT}`);
  console.log(`Usando navegador: ${executablePath}`);
});
