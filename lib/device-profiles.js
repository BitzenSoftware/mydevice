// ---------- Identidade do dispositivo emulado ----------
// Não basta o user-agent: PWAs e frameworks modernos decidem o layout por
// navigator.userAgentData.mobile e navigator.platform, que o Chrome continua
// respondendo com os valores da máquina hospedeira (mobile:false, "Win32")
// mesmo com a string de UA trocada. Sem sobrescrever isso, um site responsivo
// entrega a versão desktop dentro da moldura de celular.
const CHROMIUM_BRANDS = [
  { brand: 'Chromium', version: '125' },
  { brand: 'Google Chrome', version: '125' },
  { brand: 'Not.A/Brand', version: '24' },
];

const DEVICE_PROFILES = {
  ios_phone: {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    // O Safari não implementa Client Hints, então brands fica vazio de
    // propósito: é o que um iPhone de verdade reporta.
    metadata: { brands: [], platform: 'iOS', platformVersion: '17.5', architecture: '', model: 'iPhone', mobile: true },
  },
  ios_tablet: {
    ua: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    platform: 'iPad',
    metadata: { brands: [], platform: 'iOS', platformVersion: '17.5', architecture: '', model: 'iPad', mobile: true },
  },
  android_phone: {
    ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    metadata: { brands: CHROMIUM_BRANDS, platform: 'Android', platformVersion: '14', architecture: 'arm', model: 'Pixel 8', mobile: true },
  },
  // O Chrome em tablet Android omite "Mobile" no UA — é assim que o site
  // distingue tablet de celular.
  android_tablet: {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    platform: 'Linux armv8l',
    metadata: { brands: CHROMIUM_BRANDS, platform: 'Android', platformVersion: '14', architecture: 'arm', model: 'SM-X710', mobile: true },
  },
  desktop: {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    platform: 'Win32',
    metadata: { brands: CHROMIUM_BRANDS, platform: 'Windows', platformVersion: '15.0.0', architecture: 'x86', model: '', mobile: false },
  },
};

function profileFor(os) {
  return DEVICE_PROFILES[os] || DEVICE_PROFILES.desktop;
}

// Aplica a identidade completa do aparelho. Precisa de CDP cru: o
// page.setUserAgent do puppeteer não expõe o campo `platform`, que é o que
// corrige navigator.platform.
async function applyDeviceProfile(client, profile) {
  await client.send('Network.setUserAgentOverride', {
    userAgent: profile.ua,
    platform: profile.platform,
    userAgentMetadata: profile.metadata,
  });
  // Celular de verdade reporta 5 pontos de toque; o padrão do puppeteer é 1,
  // e algumas bibliotecas usam maxTouchPoints > 1 pra detectar touch real.
  if (profile.metadata.mobile) {
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
}

// Faz o site achar que foi aberto pela tela inicial, e não pelo navegador. Não
// dá pra deduzir isso do aparelho escolhido — é o mesmo celular nos dois casos
// — então fica como opção explícita de quem está testando o PWA.
//
// O Chrome não expõe display-mode em Emulation.setEmulatedMedia (testado: o
// media feature continua respondendo "browser"), porque de verdade ele depende
// de o app estar instalado. Então respondemos pelos dois caminhos que os sites
// realmente consultam: matchMedia e, no iOS, navigator.standalone.
async function emulateStandalone(page) {
  await page.evaluateOnNewDocument(() => {
    const stub = (query, matches) => ({
      matches, media: query, onchange: null,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
      dispatchEvent() { return false; },
    });
    const original = window.matchMedia.bind(window);
    window.matchMedia = query => {
      if (/display-mode\s*:\s*standalone/i.test(query)) return stub(query, true);
      if (/display-mode\s*:\s*browser/i.test(query)) return stub(query, false);
      return original(query);
    };
    // Como o Safari no iOS sinaliza app instalado.
    Object.defineProperty(navigator, 'standalone', { get: () => true, configurable: true });
  });
}

module.exports = { DEVICE_PROFILES, profileFor, applyDeviceProfile, emulateStandalone };
