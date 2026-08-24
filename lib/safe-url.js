const dns = require('dns').promises;

// ---------- Proteção contra alvos internos (SSRF) ----------
// O servidor abre qualquer URL que o visitante digitar. Publicamente exposto,
// isso permitiria usá-lo para alcançar coisas que só a máquina enxerga: o
// serviço rodando em localhost, a rede privada do provedor ou o endpoint de
// metadados da nuvem (que costuma entregar credenciais). Então resolvemos o
// nome antes e recusamos se apontar para um endereço não público.
function isBlockedIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => Number.isNaN(n))) return true;
  const [a, b] = p;
  if (a === 0 || a === 127 || a === 10) return true;              // este host, loopback, privado
  if (a === 172 && b >= 16 && b <= 31) return true;               // privado
  if (a === 192 && b === 168) return true;                        // privado
  if (a === 169 && b === 254) return true;                        // link-local / metadados
  if (a === 100 && b >= 64 && b <= 127) return true;              // CGNAT
  if (a >= 224) return true;                                      // multicast / reservado
  return false;
}

function isBlockedIPv6(ip) {
  const v = ip.toLowerCase().split('%')[0];
  if (v === '::' || v === '::1') return true;                     // indefinido / loopback
  if (v.startsWith('fc') || v.startsWith('fd')) return true;      // único local
  if (v.startsWith('fe8') || v.startsWith('fe9') ||
      v.startsWith('fea') || v.startsWith('feb')) return true;    // link-local
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);        // IPv4 embutido
  if (mapped) return isBlockedIPv4(mapped[1]);
  return false;
}

// Rodando na sua máquina, apontar para localhost é justamente um dos usos mais
// úteis (ver o seu próprio projeto em desenvolvimento dentro de uma moldura),
// então a trava só vale em produção. Dá para forçar com ALLOW_PRIVATE_HOSTS.
function privateHostsAllowed() {
  return process.env.ALLOW_PRIVATE_HOSTS
    ? process.env.ALLOW_PRIVATE_HOSTS === '1'
    : process.env.NODE_ENV !== 'production';
}

async function assertPublicUrl(rawUrl) {
  if (privateHostsAllowed()) return;
  const parsed = new URL(rawUrl);
  const addrs = await dns.lookup(parsed.hostname, { all: true });
  if (!addrs.length) throw new Error('Não foi possível resolver esse endereço.');
  for (const { address, family } of addrs) {
    const blocked = family === 6 ? isBlockedIPv6(address) : isBlockedIPv4(address);
    if (blocked) throw new Error('Esse endereço é interno e não pode ser aberto por aqui.');
  }
}

// Argumentos de linha de comando que valem em qualquer ambiente: fecham o
// endereço de metadados da nuvem no próprio resolvedor do navegador, para que
// nem um redirecionamento consiga alcançá-lo.
const HARDENING_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--host-resolver-rules=MAP 169.254.169.254 0.0.0.0,MAP metadata.google.internal 0.0.0.0',
];

module.exports = { isBlockedIPv4, isBlockedIPv6, assertPublicUrl, privateHostsAllowed, HARDENING_ARGS };
