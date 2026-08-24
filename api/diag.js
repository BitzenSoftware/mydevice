// Endpoint de diagnóstico: responde sempre em JSON, sem abrir navegador.
// Serve para descobrir por que a captura falha num ambiente onde não dá para
// ler os logs — cada etapa é testada isoladamente e reportada.
module.exports = async (_req, res) => {
  const out = {
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    region: process.env.VERCEL_REGION || null,
    nodeEnv: process.env.NODE_ENV || null,
    memoryLimitMB: Number(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) || null,
    steps: {},
  };

  const step = async (nome, fn) => {
    try { out.steps[nome] = { ok: true, ...(await fn()) }; }
    catch (err) { out.steps[nome] = { ok: false, erro: err.message }; }
  };

  await step('requirePuppeteer', () => {
    const p = require('puppeteer-core');
    return { temLaunch: typeof p.launch === 'function', temDefaultArgs: typeof p.defaultArgs === 'function' };
  });

  await step('requireSafeUrl', () => {
    const { HARDENING_ARGS } = require('../lib/safe-url');
    return { flags: HARDENING_ARGS.length };
  });

  await step('requireChromium', () => {
    const mod = require('@sparticuz/chromium');
    const c = mod.default || mod;
    return { viaDefault: !!mod.default, args: Array.isArray(c.args) ? c.args.length : null };
  });

  await step('binariosPresentes', () => {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(process.cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin');
    let alt = null;
    try { alt = path.dirname(require.resolve('@sparticuz/chromium')); } catch {}
    const listar = d => { try { return fs.readdirSync(d); } catch (e) { return 'erro: ' + e.message; } };
    return { cwdBin: listar(dir), pastaDoPacote: alt, binDoPacote: alt ? listar(path.join(alt, '..', 'bin')) : null };
  });

  // Esta é a etapa cara: descompacta o Chromium em /tmp. Se falhar aqui, o
  // problema é empacotamento ou espaço, não o navegador em si.
  await step('executablePath', async () => {
    const mod = require('@sparticuz/chromium');
    const c = mod.default || mod;
    c.setGraphicsMode = false;
    const t = Date.now();
    const p = await c.executablePath();
    const fs = require('fs');
    return { caminho: p, existe: fs.existsSync(p), ms: Date.now() - t };
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(out);
};
