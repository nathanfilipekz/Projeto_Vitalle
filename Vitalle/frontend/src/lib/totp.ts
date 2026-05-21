/**
 * Implementação minimalista de TOTP (RFC 6238) usando Web Crypto.
 * Sem dependências externas. Usada para o MFA do MVP.
 *
 * Compatível com Google Authenticator, Authy, Microsoft Authenticator etc.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/* ----------------- Base32 ----------------- */

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

/* ----------------- TOTP ----------------- */

export function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

async function hmacSha1(keyBytes: Uint8Array, msgBytes: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgBytes);
  return new Uint8Array(sig);
}

export async function totp(secretBase32: string, time: number = Math.floor(Date.now() / 1000)): Promise<string> {
  const step = 30;
  const counter = Math.floor(time / step);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // setBigUint64 não está em todos os ambientes — preenchemos manualmente.
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  const hmac = await hmacSha1(base32Decode(secretBase32), new Uint8Array(buf));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  const code = binary % 1_000_000;
  return code.toString().padStart(6, '0');
}

export async function verifyTotp(secretBase32: string, code: string, window: number = 1): Promise<boolean> {
  const cleaned = code.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  const now = Math.floor(Date.now() / 1000);
  for (let i = -window; i <= window; i++) {
    const test = await totp(secretBase32, now + i * 30);
    if (test === cleaned) return true;
  }
  return false;
}

export function buildOtpauthUri(secret: string, account: string, issuer = 'Vitalle'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** URL de imagem de QR code (serviço público, sem precisar de lib). */
export function qrImageUrl(otpauthUri: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUri)}&size=${size}x${size}&margin=0`;
}
