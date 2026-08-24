// ---------- Modelos de dispositivo ----------
// viewport: tamanho lógico (CSS px) usado para abrir o site
// dpr: pixel ratio usado na emulação (mais nitidez)
// bezel: espessura da moldura em px lógicos
// type: 'phone' | 'tablet' | 'laptop' | 'monitor' | 'browser'

const MODELS = [
  // ---- Celular ----
  {
    id: 'iphone15pro', os: 'ios_phone', category: 'phone', name: 'iPhone 15 Pro',
    viewport: { w: 393, h: 852 }, dpr: 3,
    bezel: 14, outerRadius: 62, screenRadius: 48,
    notch: 'dynamic-island', homeIndicator: true, physicalHome: false,
    body: '#1c1c1e', edge: '#3a3a3c'
  },
  {
    id: 'iphonese', os: 'ios_phone', category: 'phone', name: 'iPhone SE',
    viewport: { w: 375, h: 667 }, dpr: 2,
    bezel: 18, outerRadius: 46, screenRadius: 4,
    notch: 'none', homeIndicator: false, physicalHome: true,
    body: '#111214', edge: '#38393c'
  },
  {
    id: 'galaxys23', os: 'android_phone', category: 'phone', name: 'Samsung Galaxy S23',
    viewport: { w: 360, h: 780 }, dpr: 3,
    bezel: 10, outerRadius: 46, screenRadius: 36,
    notch: 'punch', homeIndicator: true, physicalHome: false,
    body: '#14151a', edge: '#33353d'
  },
  {
    id: 'pixel8', os: 'android_phone', category: 'phone', name: 'Google Pixel 8',
    viewport: { w: 412, h: 915 }, dpr: 2.6,
    bezel: 12, outerRadius: 54, screenRadius: 40,
    notch: 'punch', homeIndicator: true, physicalHome: false,
    body: '#1b1b1d', edge: '#3c3c3e'
  },

  // ---- Tablet ----
  {
    id: 'ipadpro', os: 'ios_tablet', category: 'tablet', name: 'iPad Pro 11"',
    viewport: { w: 834, h: 1194 }, dpr: 2,
    bezel: 26, outerRadius: 40, screenRadius: 16,
    notch: 'none', homeIndicator: true, physicalHome: false,
    body: '#1c1c1e', edge: '#3a3a3c'
  },
  {
    id: 'ipadmini', os: 'ios_tablet', category: 'tablet', name: 'iPad Mini',
    viewport: { w: 744, h: 1133 }, dpr: 2,
    bezel: 22, outerRadius: 34, screenRadius: 14,
    notch: 'none', homeIndicator: true, physicalHome: false,
    body: '#e6e6e6', edge: '#c7c7c7', bodyLight: true
  },
  {
    id: 'galaxytab', os: 'android_tablet', category: 'tablet', name: 'Galaxy Tab S9',
    viewport: { w: 800, h: 1280 }, dpr: 2,
    bezel: 18, outerRadius: 30, screenRadius: 14,
    notch: 'punch', homeIndicator: true, physicalHome: false,
    body: '#15161a', edge: '#34363d'
  },

  // ---- Desktop ----
  {
    id: 'macbook', category: 'desktop', name: 'MacBook Pro 14"',
    viewport: { w: 1440, h: 900 }, dpr: 2,
    bezel: 16, outerRadius: 18, screenRadius: 10,
    type: 'laptop', body: '#c9cbcf', edge: '#a9abaf'
  },
  {
    id: 'monitor', category: 'desktop', name: 'Monitor / iMac',
    viewport: { w: 1600, h: 900 }, dpr: 2,
    bezel: 20, outerRadius: 14, screenRadius: 6,
    type: 'monitor', body: '#dcdde0', edge: '#b9bbbf'
  },
  {
    id: 'browserwin', category: 'desktop', name: 'Janela do Navegador',
    viewport: { w: 1280, h: 800 }, dpr: 2,
    bezel: 0, outerRadius: 14, screenRadius: 0,
    type: 'browser', body: '#e9eaee', edge: '#c7c9d1'
  },
];
MODELS.forEach(m => { if (!m.type) m.type = m.category === 'phone' || m.category === 'tablet' ? m.category : 'laptop'; });

const CATEGORIES = [
  { id: 'phone', label: 'Celular' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'desktop', label: 'Desktop' },
];

// ---------- Cores de moldura ----------
// body = cor principal do corpo; edge = borda/brilho (canto oposto do gradiente)
const COLOR_PRESETS = {
  device: [ // celulares e tablets
    { id: 'grafite', name: 'Grafite', body: '#1c1c1e', edge: '#3a3a3c' },
    { id: 'titanio', name: 'Titânio', body: '#4a4a4f', edge: '#6f7076' },
    { id: 'prata', name: 'Prata', body: '#d6d7db', edge: '#f2f3f5' },
    { id: 'branco', name: 'Branco', body: '#e9eaec', edge: '#ffffff' },
    { id: 'dourado', name: 'Dourado', body: '#b89b72', edge: '#e2cba6' },
    { id: 'azul', name: 'Azul', body: '#2a4a6b', edge: '#456d94' },
    { id: 'roxo', name: 'Roxo', body: '#4a3b63', edge: '#6d5a8c' },
    { id: 'vermelho', name: 'Vermelho', body: '#7a2230', edge: '#a83f4f' },
  ],
  computer: [ // laptop, monitor e janela de navegador
    { id: 'prata', name: 'Prata', body: '#c9cbcf', edge: '#a9abaf' },
    { id: 'cinza', name: 'Cinza Espacial', body: '#7d7f84', edge: '#5c5e63' },
    { id: 'branco', name: 'Branco', body: '#eceef1', edge: '#d3d5da' },
    { id: 'preto', name: 'Preto', body: '#2a2b2f', edge: '#45464b' },
  ],
};

function paletteFor(model) {
  return (model.type === 'phone' || model.type === 'tablet') ? COLOR_PRESETS.device : COLOR_PRESETS.computer;
}

// clareia uma cor hex pra derivar a borda de uma cor personalizada
function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map(v => Math.round(v + (255 - v) * amount));
  return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---------- Estado ----------
const state = {
  category: 'phone',
  modelId: 'iphone15pro',
  url: '',
  ws: null,
  sessionGen: 0,   // incrementado a cada nova sessão, pra ignorar frames/eventos de sessões antigas
  liveOuter: null, // { w, h } do frame ao vivo atual, pra reposicionar no resize
  pendingCapture: null, // { resolve, reject } de uma captura de download em andamento
  screenEl: null,  // canvas da tela, preservado entre trocas de cor pra não reiniciar a sessão
  actualSize: true, // moldura em tamanho real (1:1): encolher pra caber borra o conteudo
  standalone: false, // true = abre como app instalado (display-mode: standalone)
  colorByModel: {},  // modelId -> id do preset escolhido
  customByModel: {}, // modelId -> cor personalizada (hex)
};

// ---------- Elementos ----------
const els = {
  form: document.getElementById('url-form'),
  urlInput: document.getElementById('url-input'),
  loadBtn: document.getElementById('load-btn'),
  errorBanner: document.getElementById('error-banner'),
  categoryTabs: document.getElementById('category-tabs'),
  modelList: document.getElementById('model-list'),
  colorList: document.getElementById('color-list'),
  canvas: document.getElementById('preview-canvas'), // usado só pra montar o PNG de download (fica sempre oculto)
  idlePlaceholder: document.getElementById('idle-placeholder'),
  liveFrame: document.getElementById('live-frame'),
  spinner: document.getElementById('spinner'),
  downloadBtn: document.getElementById('download-btn'),
  currentModelLabel: document.getElementById('current-model-label'),
  zoomBtn: document.getElementById('zoom-btn'),
  standaloneToggle: document.getElementById('standalone-toggle'),
};
const ctx = els.canvas.getContext('2d');

// ---------- UI: categorias e modelos ----------
function renderCategoryTabs() {
  els.categoryTabs.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const el = document.createElement('div');
    el.className = 'category-tab' + (cat.id === state.category ? ' active' : '');
    el.textContent = cat.label;
    el.onclick = () => {
      state.category = cat.id;
      const firstOfCat = MODELS.find(m => m.category === cat.id);
      if (firstOfCat) selectModel(firstOfCat.id);
      renderCategoryTabs();
      renderModelList();
    };
    els.categoryTabs.appendChild(el);
  });
}

function renderModelList() {
  els.modelList.innerHTML = '';
  MODELS.filter(m => m.category === state.category).forEach(m => {
    const el = document.createElement('div');
    el.className = 'model-item' + (m.id === state.modelId ? ' active' : '');
    el.innerHTML = `<div class="name">${m.name}</div><div class="dims">${m.viewport.w} × ${m.viewport.h}</div>`;
    el.onclick = () => selectModel(m.id);
    els.modelList.appendChild(el);
  });
}

// Modelo já com a cor escolhida aplicada (é o que todo o resto do código usa).
function currentModel() {
  const base = MODELS.find(m => m.id === state.modelId);
  const custom = state.customByModel[base.id];
  if (custom) return { ...base, body: custom, edge: lighten(custom, 0.22) };
  const chosen = paletteFor(base).find(c => c.id === state.colorByModel[base.id]);
  return chosen ? { ...base, body: chosen.body, edge: chosen.edge } : base;
}

function renderColorSwatches() {
  const base = MODELS.find(m => m.id === state.modelId);
  const custom = state.customByModel[base.id];
  const activeId = state.colorByModel[base.id];

  els.colorList.innerHTML = '';
  paletteFor(base).forEach(c => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'swatch' + (!custom && c.id === activeId ? ' active' : '');
    el.title = c.name;
    el.style.background = `linear-gradient(135deg, ${c.edge}, ${c.body})`;
    el.onclick = () => {
      state.colorByModel[base.id] = c.id;
      delete state.customByModel[base.id];
      renderColorSwatches();
      rebuildFrame(); // só redesenha a moldura: não reinicia a sessão nem recarrega o site
    };
    els.colorList.appendChild(el);
  });

  const picker = document.createElement('label');
  picker.className = 'swatch swatch-custom' + (custom ? ' active' : '');
  picker.title = 'Cor personalizada';
  if (custom) picker.style.background = `linear-gradient(135deg, ${lighten(custom, 0.22)}, ${custom})`;
  const input = document.createElement('input');
  input.type = 'color';
  input.value = custom || base.body;
  input.oninput = e => {
    state.customByModel[base.id] = e.target.value;
    renderColorSwatches();
    rebuildFrame();
  };
  picker.appendChild(input);
  els.colorList.appendChild(picker);
}

function selectModel(id) {
  state.modelId = id;
  els.currentModelLabel.textContent = currentModel().name;
  renderModelList();
  renderColorSwatches();
  if (state.url) startSession();
}

// ---------- Erro ----------
function showError(msg) {
  els.errorBanner.textContent = msg;
  els.errorBanner.classList.remove('hidden');
}
function clearError() {
  els.errorBanner.classList.add('hidden');
}

// ---------- Normalização de URL ----------
function normalizeUrl(raw) {
  let u = raw.trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { new URL(u); } catch { return null; }
  return u;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ---------- Sessão remota ao vivo ----------
// O site roda de verdade num Chrome headless no servidor, com emulação real do
// dispositivo escolhido (user-agent mobile, toque, viewport correto) — por isso
// PWAs reconhecem certinho que estão sendo acessados por um celular. A tela é
// transmitida por WebSocket, e cliques/toques/teclado aqui são repassados de
// volta para esse Chrome headless. Como nada é embutido no seu navegador de
// verdade, funciona mesmo em sites que bloqueiam iframe.
//
// O servidor manda dois tipos de quadro (ver comentário no server.js): rápidos
// em 1x enquanto você interage, e nítidos em alta resolução quando você para.
// Os dois caem no mesmo canvas, que fica sempre no tamanho da alta resolução.
const FRAME_LIVE = 1;
const FRAME_SHARP = 2;
const FRAME_SHOT = 3;

function domEl(tag, className, cssText) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (cssText) e.style.cssText = cssText;
  return e;
}

function buildRemoteScreen(vw, vh, dpr) {
  const canvasEl = document.createElement('canvas');
  canvasEl.className = 'remote-canvas';
  canvasEl.width = Math.round(vw * dpr);
  canvasEl.height = Math.round(vh * dpr);
  canvasEl.style.cssText = `width:${vw}px; height:${vh}px;`;
  canvasEl.tabIndex = 0;
  return canvasEl;
}

function attachInputHandlers(canvasEl, vw, vh, mobile, gen) {
  const toDevice = (clientX, clientY) => {
    const r = canvasEl.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(vw, (clientX - r.left) / r.width * vw)),
      y: Math.max(0, Math.min(vh, (clientY - r.top) / r.height * vh)),
    };
  };
  const send = obj => {
    if (gen !== state.sessionGen) return;
    if (state.ws && state.ws.readyState === WebSocket.OPEN) state.ws.send(JSON.stringify(obj));
  };

  if (mobile) {
    canvasEl.addEventListener('pointerdown', e => {
      e.preventDefault();
      canvasEl.setPointerCapture(e.pointerId);
      canvasEl.focus();
      const p = toDevice(e.clientX, e.clientY);
      send({ t: 'touch', phase: 'start', x: p.x, y: p.y });
    });
    canvasEl.addEventListener('pointermove', e => {
      if (e.buttons !== 1) return;
      const p = toDevice(e.clientX, e.clientY);
      send({ t: 'touch', phase: 'move', x: p.x, y: p.y });
    });
    const endHandler = e => {
      const p = toDevice(e.clientX, e.clientY);
      send({ t: 'touch', phase: 'end', x: p.x, y: p.y });
    };
    canvasEl.addEventListener('pointerup', endHandler);
    canvasEl.addEventListener('pointercancel', endHandler);
    // roda do mouse (quem está pré-visualizando não tem dedo/touch de verdade) rola a página real
    canvasEl.addEventListener('wheel', e => {
      e.preventDefault();
      const p = toDevice(e.clientX, e.clientY);
      send({ t: 'wheel', x: p.x, y: p.y, deltaX: e.deltaX, deltaY: e.deltaY });
    }, { passive: false });
  } else {
    canvasEl.addEventListener('pointerdown', e => {
      e.preventDefault();
      canvasEl.setPointerCapture(e.pointerId);
      canvasEl.focus();
      const p = toDevice(e.clientX, e.clientY);
      send({ t: 'mouse', phase: 'down', x: p.x, y: p.y });
    });
    canvasEl.addEventListener('pointermove', e => {
      const p = toDevice(e.clientX, e.clientY);
      send({ t: 'mouse', phase: 'move', x: p.x, y: p.y });
    });
    canvasEl.addEventListener('pointerup', e => {
      const p = toDevice(e.clientX, e.clientY);
      send({ t: 'mouse', phase: 'up', x: p.x, y: p.y });
    });
    canvasEl.addEventListener('wheel', e => {
      e.preventDefault();
      const p = toDevice(e.clientX, e.clientY);
      send({ t: 'wheel', x: p.x, y: p.y, deltaX: e.deltaX, deltaY: e.deltaY });
    }, { passive: false });
  }

  const specialKeys = new Set(['Backspace', 'Enter', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', ' ']);
  canvasEl.addEventListener('keydown', e => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      send({ t: 'text', text: e.key });
      e.preventDefault();
    } else if (specialKeys.has(e.key)) {
      send({ t: 'key', phase: 'down', key: e.key, code: e.code, keyCode: e.keyCode });
      e.preventDefault();
    }
  });
  canvasEl.addEventListener('keyup', e => {
    if (specialKeys.has(e.key)) send({ t: 'key', phase: 'up', key: e.key, code: e.code, keyCode: e.keyCode });
  });
}

function buildPhoneTabletFrame(m, screenEl) {
  const vw = m.viewport.w, vh = m.viewport.h, b = m.bezel;
  const outerW = vw + b * 2, outerH = vh + b * 2;

  const frame = domEl('div', 'device-frame', `width:${outerW}px; height:${outerH}px;`);

  frame.appendChild(domEl('div', 'device-body',
    `border-radius:${m.outerRadius}px; background:linear-gradient(135deg, ${m.edge}, ${m.body});`));

  const screen = domEl('div', 'device-screen',
    `left:${b}px; top:${b}px; width:${vw}px; height:${vh}px; border-radius:${m.screenRadius}px;`);
  screen.appendChild(screenEl);
  frame.appendChild(screen);

  if (m.notch === 'dynamic-island') {
    const pillW = vw * 0.11, pillH = pillW * 0.3;
    frame.appendChild(domEl('div', 'frame-decor',
      `left:${b + (vw - pillW) / 2}px; top:${b + 10}px; width:${pillW}px; height:${pillH}px; border-radius:${pillH / 2}px; background:#000;`));
  } else if (m.notch === 'punch') {
    const d = vw * 0.036;
    frame.appendChild(domEl('div', 'frame-decor',
      `left:${b + vw / 2 - d / 2}px; top:${b + 16 - d / 2}px; width:${d}px; height:${d}px; border-radius:50%; background:#000;`));
  }

  if (m.homeIndicator) {
    const barW = vw * 0.32, barH = Math.max(4, vw * 0.01);
    frame.appendChild(domEl('div', 'frame-decor',
      `left:${b + (vw - barW) / 2}px; top:${b + vh - barH - 8}px; width:${barW}px; height:${barH}px; border-radius:${barH / 2}px; background:rgba(255,255,255,0.6);`));
  }

  if (m.physicalHome) {
    const r = b * 0.42;
    frame.appendChild(domEl('div', 'frame-decor',
      `left:${outerW / 2 - r}px; top:${b + vh + b / 2 - r}px; width:${r * 2}px; height:${r * 2}px; border-radius:50%; border:2px solid rgba(255,255,255,0.35);`));
  }

  const btnW = 3;
  const sideBtn = (left, top, w, h) => frame.appendChild(domEl('div', 'frame-side-btn', `left:${left}px; top:${top}px; width:${w}px; height:${h}px; background:${m.edge};`));
  sideBtn(-btnW, outerH * 0.18, btnW, outerH * 0.08);
  sideBtn(-btnW, outerH * 0.28, btnW, outerH * 0.1);
  sideBtn(-btnW, outerH * 0.40, btnW, outerH * 0.1);
  sideBtn(outerW, outerH * 0.2, btnW, outerH * 0.1);

  return { frameEl: frame, outerW, outerH };
}

function buildLaptopFrame(m, screenEl) {
  const vw = m.viewport.w, vh = m.viewport.h, b = m.bezel;
  const screenOuterW = vw + b * 2, screenOuterH = vh + b * 2;
  const baseH = screenOuterW * 0.045;
  const baseOverhang = screenOuterW * 0.035;
  const outerW = screenOuterW + baseOverhang * 2;
  const outerH = screenOuterH + baseH + 6;
  const sox = baseOverhang;

  const frame = domEl('div', 'device-frame', `width:${outerW}px; height:${outerH}px;`);

  frame.appendChild(domEl('div', 'device-body',
    `left:${sox}px; top:0px; width:${screenOuterW}px; height:${screenOuterH}px; border-radius:${m.outerRadius}px; background:#1b1c1e;`));

  const screen = domEl('div', 'device-screen',
    `left:${sox + b}px; top:${b}px; width:${vw}px; height:${vh}px; border-radius:${m.screenRadius}px;`);
  screen.appendChild(screenEl);
  frame.appendChild(screen);

  frame.appendChild(domEl('div', 'frame-decor',
    `left:${sox + screenOuterW / 2 - 1.6}px; top:${b * 0.5 - 1.6}px; width:3.2px; height:3.2px; border-radius:50%; background:#050505;`));

  frame.appendChild(domEl('div', 'frame-decor',
    `left:${sox}px; top:${screenOuterH - 2}px; width:${screenOuterW}px; height:6px; border-radius:2px; background:#9a9c9f;`));

  const baseTopY = screenOuterH + 4;
  frame.appendChild(domEl('div', 'frame-decor',
    `left:0px; top:${baseTopY}px; width:${outerW}px; height:${baseH}px; background:linear-gradient(180deg, ${m.edge}, ${m.body}); clip-path: polygon(${sox}px 0, ${sox + screenOuterW}px 0, ${outerW}px 100%, 0px 100%);`));

  const notchW = screenOuterW * 0.1;
  frame.appendChild(domEl('div', 'frame-decor',
    `left:${sox + (screenOuterW - notchW) / 2}px; top:${baseTopY + baseH - 4}px; width:${notchW}px; height:5px; border-radius:2px; background:rgba(0,0,0,0.15);`));

  return { frameEl: frame, outerW, outerH };
}

function buildMonitorFrame(m, screenEl) {
  const vw = m.viewport.w, vh = m.viewport.h, b = m.bezel;
  const screenOuterW = vw + b * 2, screenOuterH = vh + b * 2;
  const neckH = screenOuterW * 0.05, neckW = screenOuterW * 0.09;
  const footH = screenOuterW * 0.018, footW = screenOuterW * 0.22;
  const outerW = screenOuterW;
  const outerH = screenOuterH + neckH + footH + 6;

  const frame = domEl('div', 'device-frame', `width:${outerW}px; height:${outerH}px;`);

  frame.appendChild(domEl('div', 'device-body',
    `border-radius:${m.outerRadius}px; background:linear-gradient(135deg, ${m.edge}, ${m.body});`));

  const screen = domEl('div', 'device-screen',
    `left:${b}px; top:${b}px; width:${vw}px; height:${vh}px; border-radius:${m.screenRadius}px;`);
  screen.appendChild(screenEl);
  frame.appendChild(screen);

  frame.appendChild(domEl('div', 'frame-decor',
    `left:${(outerW - neckW) / 2}px; top:${screenOuterH - 2}px; width:${neckW}px; height:${neckH}px; border-radius:4px; background:${m.edge};`));
  frame.appendChild(domEl('div', 'frame-decor',
    `left:${(outerW - footW) / 2}px; top:${screenOuterH + neckH - 2}px; width:${footW}px; height:${footH}px; border-radius:${footH / 2}px; background:${m.edge};`));

  return { frameEl: frame, outerW, outerH };
}

function buildBrowserFrame(m, screenEl, url) {
  const vw = m.viewport.w, vh = m.viewport.h;
  const topBar = 42;
  const outerW = vw, outerH = vh + topBar;

  const frame = domEl('div', 'device-frame',
    `width:${outerW}px; height:${outerH}px; border:1px solid ${m.edge}; border-radius:${m.outerRadius}px; box-sizing:border-box; overflow:hidden;`);

  frame.appendChild(domEl('div', 'device-body', `background:${m.body};`));

  const topbar = domEl('div', 'browser-topbar', `width:${outerW}px; height:${topBar}px;`);
  const dots = domEl('div', 'browser-dots', `position:absolute; left:16px; top:${topBar / 2 - 6}px;`);
  ['#ff5f57', '#febc2e', '#28c840'].forEach(color => {
    dots.appendChild(domEl('div', 'browser-dot', `width:12px; height:12px; background:${color};`));
  });
  topbar.appendChild(dots);

  const addr = domEl('div', 'browser-address',
    `position:absolute; left:100px; top:${(topBar - 24) / 2}px; width:${outerW - 200}px; height:24px; border-radius:12px; padding:0 14px; font-size:13px;`);
  addr.textContent = '🔒  ' + url;
  topbar.appendChild(addr);
  frame.appendChild(topbar);

  const screen = domEl('div', 'device-screen', `left:0px; top:${topBar}px; width:${vw}px; height:${vh}px;`);
  screen.appendChild(screenEl);
  frame.appendChild(screen);

  return { frameEl: frame, outerW, outerH };
}

function layoutLiveFrame(outerW, outerH) {
  const sizer = els.liveFrame.querySelector('.frame-sizer');
  const frameEl = els.liveFrame.querySelector('.device-frame');
  if (!sizer || !frameEl) return;
  const stage = document.getElementById('stage');
  const availW = Math.max(stage.clientWidth - 20, 100);
  // Em tamanho real a altura não limita: a página rola.
  const availH = Math.max((state.actualSize ? window.innerHeight : stage.clientHeight) - 20, 100);
  // Reduzir a moldura pra caber na janela encolhe junto o conteúdo do site, e
  // é isso que deixa o texto pequeno demais pra avaliar. Então o padrão escala
  // por moldura: mantém 1:1 sempre que couber na LARGURA (celular e tablet
  // cabem), rolando na vertical; só reduz o necessário quando a moldura é mais
  // larga que o palco (desktop), porque rolagem horizontal é pior que reduzir.
  const fit = Math.min(availW / outerW, availH / outerH);
  const scale = state.actualSize ? Math.min(1, availW / outerW) : fit;
  sizer.style.width = (outerW * scale) + 'px';
  sizer.style.height = (outerH * scale) + 'px';
  frameEl.style.transform = `scale(${scale})`;

  // Mostrar a escala em vigor evita o engano de estar vendo o site reduzido
  // sem perceber — reduzido, o texto do site encolhe junto e parece borrado.
  const pct = Math.round(scale * 100);
  els.zoomBtn.textContent = `Zoom ${pct}%`;
  els.zoomBtn.classList.toggle('active', pct === 100);
  els.zoomBtn.title = state.actualSize
    ? 'Tamanho real. Clique para encolher a moldura até caber na janela.'
    : 'Reduzido para caber na janela — o conteúdo do site encolhe junto. Clique para ver em tamanho real.';
}

function closeSession() {
  if (state.ws) {
    // Marca antes de fechar pra que o onclose não trate isto como queda.
    state.ws.intentionalClose = true;
    try { state.ws.close(); } catch {}
    state.ws = null;
  }
  if (state.pendingCapture) {
    state.pendingCapture.reject(new Error('A sessão foi encerrada antes da captura terminar.'));
    state.pendingCapture = null;
  }
}

// Redesenha só a moldura em volta da tela, reaproveitando o mesmo canvas e a
// mesma conexão. É o que permite trocar a cor sem recarregar o site.
function rebuildFrame() {
  if (!state.screenEl) return;
  const m = currentModel();

  let built;
  if (m.type === 'laptop') built = buildLaptopFrame(m, state.screenEl);
  else if (m.type === 'monitor') built = buildMonitorFrame(m, state.screenEl);
  else if (m.type === 'browser') built = buildBrowserFrame(m, state.screenEl, state.url);
  else built = buildPhoneTabletFrame(m, state.screenEl);

  els.liveFrame.innerHTML = '';
  const sizer = domEl('div', 'frame-sizer');
  sizer.appendChild(built.frameEl);
  els.liveFrame.appendChild(sizer);
  state.liveOuter = { w: built.outerW, h: built.outerH };
  layoutLiveFrame(built.outerW, built.outerH);
}

// ---------- Modo de captura estática ----------
// Onde não há motor de navegação ao vivo (hospedagem serverless, por exemplo),
// o site é capturado uma vez e exibido parado dentro da moldura. Sem clique e
// sem rolagem — mas escolher aparelho, trocar a cor e baixar o PNG continuam
// funcionando igual.
const LIVE_ENGINE = (window.__MYDEVICE__ || {}).liveEngine;
const LIVE_AVAILABLE = LIVE_ENGINE !== null && LIVE_ENGINE !== undefined;

function screenshotUrl(m) {
  const mobile = m.category === 'phone' || m.category === 'tablet';
  const params = new URLSearchParams({
    url: state.url, width: m.viewport.w, height: m.viewport.h, dpr: m.dpr, mobile: mobile ? '1' : '0',
    os: m.os || 'desktop', standalone: state.standalone ? '1' : '0',
  });
  return '/api/screenshot?' + params.toString();
}

async function startStaticSession() {
  closeSession();
  const gen = ++state.sessionGen;
  const m = currentModel();

  els.idlePlaceholder.classList.add('hidden');
  els.liveFrame.classList.remove('hidden');
  els.spinner.classList.remove('hidden');
  els.downloadBtn.disabled = true;
  clearError();

  const screenEl = buildRemoteScreen(m.viewport.w, m.viewport.h, m.dpr);
  state.screenEl = screenEl;
  rebuildFrame();
  els.currentModelLabel.textContent = m.name;

  try {
    const resp = await fetch(screenshotUrl(m));
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      // Sem `error` no corpo, a função caiu antes de tratar o pedido — o
      // status e o código ajudam a distinguir isso de uma falha do site alvo.
      // O `detail` traz a mensagem crua do servidor — é o que permite
      // identificar a causa sem acesso aos logs da plataforma.
      throw new Error(
        data.error
          ? [data.error, data.code && `[${data.code}]`, data.detail && `— ${data.detail}`]
              .filter(Boolean).join(' ')
          : `Falha ao carregar o site (resposta ${resp.status} do servidor de captura).`
      );
    }
    const bitmap = await createImageBitmap(await resp.blob());
    if (gen !== state.sessionGen) return;
    screenEl.width = bitmap.width;
    screenEl.height = bitmap.height;
    screenEl.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    state.staticShot = true;
    els.downloadBtn.disabled = false;
  } catch (err) {
    if (gen === state.sessionGen) showError(err.message);
  } finally {
    if (gen === state.sessionGen) els.spinner.classList.add('hidden');
  }
}

function startSession() {
  return LIVE_AVAILABLE ? startRemoteSession() : startStaticSession();
}

function startRemoteSession() {
  closeSession();
  const gen = ++state.sessionGen;
  const m = currentModel();
  const mobile = m.category === 'phone' || m.category === 'tablet';

  els.idlePlaceholder.classList.add('hidden');
  els.liveFrame.classList.remove('hidden');
  els.spinner.classList.remove('hidden');
  els.downloadBtn.disabled = true;
  clearError();

  const screenEl = buildRemoteScreen(m.viewport.w, m.viewport.h, m.dpr);
  attachInputHandlers(screenEl, m.viewport.w, m.viewport.h, mobile, gen);
  state.screenEl = screenEl;
  const screenCtx = screenEl.getContext('2d');
  rebuildFrame();
  els.currentModelLabel.textContent = m.name;

  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const params = new URLSearchParams({
    url: state.url, width: m.viewport.w, height: m.viewport.h, dpr: m.dpr, mobile: mobile ? '1' : '0',
    os: m.os || 'desktop', standalone: state.standalone ? '1' : '0',
  });
  // LIVE_ENGINE vazio significa "mesmo servidor que entregou a página"; quando
  // preenchido, o motor de navegação está hospedado em outro endereço.
  const base = LIVE_ENGINE
    ? LIVE_ENGINE.replace(/^http/, 'ws').replace(/\/+$/, '')
    : `${proto}://${location.host}`;
  const ws = new WebSocket(`${base}/ws/session?${params.toString()}`);
  ws.binaryType = 'arraybuffer';
  state.ws = ws;

  // Se um quadro nítido chega enquanto outro ainda está sendo decodificado, o
  // mais novo substitui o pendente — melhor mostrar o atual do que enfileirar.
  let decoding = false;
  let queued = null;

  const drawNext = async () => {
    if (decoding || !queued) return;
    decoding = true;
    const { bytes, mime } = queued;
    queued = null;
    try {
      const bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
      if (gen === state.sessionGen) {
        // O canvas acompanha o tamanho real do quadro que chegou (1x nos quadros
        // rápidos, alta resolução nos nítidos) e o CSS cuida da escala. Ampliar
        // todo quadro rápido pra resolução alta custava 3 milhões de pixels por
        // quadro e era o que travava a navegação.
        if (screenEl.width !== bitmap.width || screenEl.height !== bitmap.height) {
          screenEl.width = bitmap.width;
          screenEl.height = bitmap.height;
        }
        screenCtx.drawImage(bitmap, 0, 0);
      }
      bitmap.close();
    } catch {
      // quadro corrompido/abortado: ignora e segue pro próximo
    }
    decoding = false;
    drawNext();
  };

  ws.onmessage = ev => {
    if (gen !== state.sessionGen) return;

    if (typeof ev.data === 'string') { // mensagens de controle
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.t === 'capture-error' && state.pendingCapture) {
        state.pendingCapture.reject(new Error(msg.message));
        state.pendingCapture = null;
      } else if (msg.t === 'error') {
        els.spinner.classList.add('hidden');
        showError(msg.message);
      }
      return;
    }

    const view = new Uint8Array(ev.data);
    const type = view[0];
    const bytes = view.subarray(1);

    if (type === FRAME_SHOT) {
      if (state.pendingCapture) {
        state.pendingCapture.resolve(new Blob([bytes], { type: 'image/png' }));
        state.pendingCapture = null;
      }
      return;
    }

    els.spinner.classList.add('hidden');
    els.downloadBtn.disabled = false;
    queued = { bytes, mime: type === FRAME_SHARP ? 'image/png' : 'image/jpeg' };
    drawNext();
  };

  ws.onerror = () => {
    if (gen === state.sessionGen) {
      els.spinner.classList.add('hidden');
      showError('Erro de conexão com a sessão remota.');
    }
  };

  // Sem isto, uma sessão que morre (servidor reiniciado, aba dormindo, rede
  // caindo) deixava o spinner girando pra sempre: o onerror acima não dispara
  // quando o socket só fecha.
  ws.onclose = () => {
    if (gen !== state.sessionGen || ws.intentionalClose) return;
    els.spinner.classList.add('hidden');
    showError('A sessão foi encerrada. Clique em Carregar para abrir de novo.');
  };
}

function requestCapture() {
  return new Promise((resolve, reject) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      reject(new Error('A sessão não está conectada.'));
      return;
    }
    if (state.pendingCapture) {
      reject(new Error('Já existe uma captura em andamento.'));
      return;
    }
    state.pendingCapture = { resolve, reject };
    state.ws.send(JSON.stringify({ t: 'capture' }));
    setTimeout(() => {
      if (state.pendingCapture && state.pendingCapture.resolve === resolve) {
        state.pendingCapture.reject(new Error('Tempo esgotado ao gerar a captura.'));
        state.pendingCapture = null;
      }
    }, 15000);
  });
}

async function downloadFrame() {
  const originalHtml = els.downloadBtn.innerHTML;
  els.downloadBtn.disabled = true;
  els.downloadBtn.textContent = 'Gerando imagem...';
  try {
    const m = currentModel();
    // Com motor ao vivo, captura exatamente o que está sendo exibido AGORA
    // (inclusive telas pra onde o usuário navegou). No modo estático, pede
    // uma captura nova da URL.
    let pngBlob;
    if (LIVE_AVAILABLE) {
      pngBlob = await requestCapture();
    } else {
      const resp = await fetch(screenshotUrl(m));
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao gerar a captura para download.');
      }
      pngBlob = await resp.blob();
    }
    const img = await createImageBitmap(pngBlob);
    drawDownloadCanvas(m, img);

    els.canvas.toBlob(pngBlob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pngBlob);
      a.download = `mockup-${m.id}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, 'image/png');
  } catch (err) {
    showError(err.message);
  } finally {
    els.downloadBtn.innerHTML = originalHtml;
    els.downloadBtn.disabled = false;
  }
}

// ---------- Desenho no canvas oculto, só pra compor o PNG de download ----------
function roundRectPath(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function drawScreenshotClipped(c, img, sx, sy, sw, sh, radius) {
  c.save();
  roundRectPath(c, sx, sy, sw, sh, radius);
  c.clip();
  const scale = Math.max(sw / img.width, sh / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  const dx = sx + (sw - dw) / 2, dy = sy + (sh - dh) / 2;
  c.drawImage(img, dx, dy, dw, dh);
  c.restore();
}

function drawPhoneOrTablet(c, m, img) {
  const vw = m.viewport.w, vh = m.viewport.h, b = m.bezel;
  const outerW = vw + b * 2, outerH = vh + b * 2;
  const ox = b, oy = b;

  roundRectPath(c, 0, 0, outerW, outerH, m.outerRadius);
  const grad = c.createLinearGradient(0, 0, outerW, outerH);
  grad.addColorStop(0, m.edge);
  grad.addColorStop(1, m.body);
  c.fillStyle = grad;
  c.fill();

  const sx = ox, sy = oy, sw = vw, sh = vh;
  drawScreenshotClipped(c, img, sx, sy, sw, sh, m.screenRadius);

  roundRectPath(c, sx, sy, sw, sh, m.screenRadius);
  c.lineWidth = 1.5;
  c.strokeStyle = 'rgba(255,255,255,0.08)';
  c.stroke();

  if (m.notch === 'dynamic-island') {
    const pillW = vw * 0.11, pillH = pillW * 0.3;
    roundRectPath(c, sx + (vw - pillW) / 2, sy + 10, pillW, pillH, pillH / 2);
    c.fillStyle = '#000';
    c.fill();
  } else if (m.notch === 'punch') {
    const r = vw * 0.018;
    c.beginPath();
    c.arc(sx + vw / 2, sy + 16, r, 0, Math.PI * 2);
    c.fillStyle = '#000';
    c.fill();
  }

  if (m.homeIndicator) {
    const barW = vw * 0.32, barH = Math.max(4, vw * 0.01);
    roundRectPath(c, sx + (vw - barW) / 2, sy + sh - barH - 8, barW, barH, barH / 2);
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.fill();
  }

  if (m.physicalHome) {
    const r = b * 0.42;
    c.beginPath();
    c.arc(outerW / 2, oy + sh + b / 2, r, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 2;
    c.stroke();
  }

  c.fillStyle = m.edge;
  const btnW = 3;
  c.fillRect(-btnW, outerH * 0.18, btnW, outerH * 0.08);
  c.fillRect(-btnW, outerH * 0.28, btnW, outerH * 0.1);
  c.fillRect(-btnW, outerH * 0.40, btnW, outerH * 0.1);
  c.fillRect(outerW, outerH * 0.2, btnW, outerH * 0.1);

  return { outerW, outerH };
}

function drawLaptop(c, m, img) {
  const vw = m.viewport.w, vh = m.viewport.h, b = m.bezel;
  const screenOuterW = vw + b * 2, screenOuterH = vh + b * 2;
  const baseH = screenOuterW * 0.045;
  const baseOverhang = screenOuterW * 0.035;
  const outerW = screenOuterW + baseOverhang * 2;
  const outerH = screenOuterH + baseH + 6;
  const sox = baseOverhang;

  roundRectPath(c, sox, 0, screenOuterW, screenOuterH, m.outerRadius);
  c.fillStyle = '#1b1c1e';
  c.fill();

  const sx = sox + b, sy = b, sw = vw, sh = vh;
  drawScreenshotClipped(c, img, sx, sy, sw, sh, m.screenRadius);

  c.beginPath();
  c.arc(sox + screenOuterW / 2, b * 0.5, 1.6, 0, Math.PI * 2);
  c.fillStyle = '#050505';
  c.fill();

  c.fillStyle = '#9a9c9f';
  roundRectPath(c, sox, screenOuterH - 2, screenOuterW, 6, 2);
  c.fill();

  const baseTopY = screenOuterH + 4;
  c.beginPath();
  c.moveTo(sox, baseTopY);
  c.lineTo(sox + screenOuterW, baseTopY);
  c.lineTo(outerW, baseTopY + baseH);
  c.lineTo(0, baseTopY + baseH);
  c.closePath();
  const grad = c.createLinearGradient(0, baseTopY, 0, baseTopY + baseH);
  grad.addColorStop(0, m.edge);
  grad.addColorStop(1, m.body);
  c.fillStyle = grad;
  c.fill();

  const notchW = screenOuterW * 0.1;
  c.beginPath();
  roundRectPath(c, sox + (screenOuterW - notchW) / 2, baseTopY + baseH - 4, notchW, 5, 2);
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.fill();

  return { outerW, outerH };
}

function drawMonitor(c, m, img) {
  const vw = m.viewport.w, vh = m.viewport.h, b = m.bezel;
  const screenOuterW = vw + b * 2, screenOuterH = vh + b * 2;
  const neckH = screenOuterW * 0.05;
  const neckW = screenOuterW * 0.09;
  const footH = screenOuterW * 0.018;
  const footW = screenOuterW * 0.22;
  const outerW = screenOuterW;
  const outerH = screenOuterH + neckH + footH + 6;

  roundRectPath(c, 0, 0, screenOuterW, screenOuterH, m.outerRadius);
  const grad = c.createLinearGradient(0, 0, screenOuterW, screenOuterH);
  grad.addColorStop(0, m.edge);
  grad.addColorStop(1, m.body);
  c.fillStyle = grad;
  c.fill();

  const sx = b, sy = b, sw = vw, sh = vh;
  drawScreenshotClipped(c, img, sx, sy, sw, sh, m.screenRadius);

  c.fillStyle = m.edge;
  roundRectPath(c, (outerW - neckW) / 2, screenOuterH - 2, neckW, neckH, 4);
  c.fill();

  roundRectPath(c, (outerW - footW) / 2, screenOuterH + neckH - 2, footW, footH, footH / 2);
  c.fill();

  return { outerW, outerH };
}

function drawBrowserWindow(c, m, img, url) {
  const vw = m.viewport.w, vh = m.viewport.h;
  const topBar = 42;
  const outerW = vw, outerH = vh + topBar;

  roundRectPath(c, 0, 0, outerW, outerH, m.outerRadius);
  c.fillStyle = m.body;
  c.fill();

  c.save();
  roundRectPath(c, 0, 0, outerW, topBar + m.outerRadius, m.outerRadius);
  c.clip();
  c.fillStyle = m.body;
  c.fillRect(0, 0, outerW, topBar);
  c.restore();

  const dotColors = ['#ff5f57', '#febc2e', '#28c840'];
  dotColors.forEach((color, i) => {
    c.beginPath();
    c.arc(22 + i * 20, topBar / 2, 6, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  });

  const addrX = 100, addrW = outerW - 200, addrH = 24;
  roundRectPath(c, addrX, (topBar - addrH) / 2, addrW, addrH, addrH / 2);
  c.fillStyle = 'rgba(0,0,0,0.06)';
  c.fill();
  c.fillStyle = '#54565c';
  c.font = '13px -apple-system, "Segoe UI", sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  const label = (url || 'https://').length > 60 ? url.slice(0, 60) + '…' : (url || 'https://');
  c.fillText('🔒  ' + label, addrX + 14, topBar / 2 + 1);

  const sx = 0, sy = topBar, sw = vw, sh = vh;
  c.save();
  c.beginPath();
  c.rect(sx, sy, sw, sh);
  c.clip();
  drawScreenshotClipped(c, img, sx, sy, sw, sh, 0);
  c.restore();

  roundRectPath(c, 0, 0, outerW, outerH, m.outerRadius);
  c.lineWidth = 1;
  c.strokeStyle = m.edge;
  c.stroke();

  return { outerW, outerH };
}

function drawDownloadCanvas(m, img) {
  const EXPORT_SCALE = 2;
  let dims;
  if (m.type === 'laptop') {
    const screenOuterW = m.viewport.w + m.bezel * 2, screenOuterH = m.viewport.h + m.bezel * 2;
    const baseH = screenOuterW * 0.045, baseOverhang = screenOuterW * 0.035;
    dims = { w: screenOuterW + baseOverhang * 2, h: screenOuterH + baseH + 6 };
  } else if (m.type === 'monitor') {
    const screenOuterW = m.viewport.w + m.bezel * 2, screenOuterH = m.viewport.h + m.bezel * 2;
    const neckH = screenOuterW * 0.05, footH = screenOuterW * 0.018;
    dims = { w: screenOuterW, h: screenOuterH + neckH + footH + 6 };
  } else if (m.type === 'browser') {
    dims = { w: m.viewport.w, h: m.viewport.h + 42 };
  } else {
    dims = { w: m.viewport.w + m.bezel * 2, h: m.viewport.h + m.bezel * 2 };
  }

  els.canvas.width = dims.w * EXPORT_SCALE;
  els.canvas.height = dims.h * EXPORT_SCALE;
  ctx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0);
  ctx.clearRect(0, 0, dims.w, dims.h);

  switch (m.type) {
    case 'laptop': drawLaptop(ctx, m, img); break;
    case 'monitor': drawMonitor(ctx, m, img); break;
    case 'browser': drawBrowserWindow(ctx, m, img, state.url); break;
    default: drawPhoneOrTablet(ctx, m, img); break;
  }
}

// ---------- Eventos ----------
els.form.addEventListener('submit', e => {
  e.preventDefault();
  const normalized = normalizeUrl(els.urlInput.value);
  if (!normalized) {
    showError('Digite uma URL válida, ex: https://exemplo.com');
    return;
  }
  state.url = normalized;
  els.urlInput.value = normalized;
  startSession();
});

els.downloadBtn.addEventListener('click', downloadFrame);

// Trocar o modo muda como a página é aberta, então a sessão precisa recomeçar.
els.standaloneToggle.addEventListener('change', () => {
  state.standalone = els.standaloneToggle.checked;
  if (state.url) startSession();
});

els.zoomBtn.addEventListener('click', () => {
  state.actualSize = !state.actualSize;
  document.body.classList.toggle('actual-size', state.actualSize);
  if (state.liveOuter) layoutLiveFrame(state.liveOuter.w, state.liveOuter.h);
});

window.addEventListener('resize', () => {
  if (state.liveOuter) layoutLiveFrame(state.liveOuter.w, state.liveOuter.h);
});

// ---------- Inicialização ----------
renderCategoryTabs();
renderModelList();
renderColorSwatches();
// O padrao e 1:1. Encolher a moldura pra caber na janela reduz junto o
// conteudo do site (numa janela baixa chega a 45%), e ai o texto fica
// pequeno demais pra avaliar qualquer coisa.
els.zoomBtn.textContent = 'Zoom 100%';
els.zoomBtn.classList.add('active');
document.body.classList.add('actual-size');
els.currentModelLabel.textContent = currentModel().name;
