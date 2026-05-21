import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { PrismaService } from '../../providers/prisma/prisma.service';

/**
 * Serviço de MFA TOTP (RFC 6238) sem dependências externas.
 * Compatível com Google Authenticator, Authy, Microsoft Authenticator etc.
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpCode(secretBase32: string, timeSeconds: number): string {
  const step = 30;
  const counter = Math.floor(timeSeconds / step);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac('sha1', base32Decode(secretBase32)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return (binary % 1_000_000).toString().padStart(6, '0');
}

function verifyTotpCode(secret: string, code: string, window = 1): boolean {
  const cleaned = (code || '').trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  const now = Math.floor(Date.now() / 1000);
  for (let i = -window; i <= window; i++) {
    if (totpCode(secret, now + i * 30) === cleaned) return true;
  }
  return false;
}

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera um novo secret + URI otpauth para o usuário escanear.
   * O secret é guardado em users.mfa_secret SEM ativar o mfa_enabled
   * (só é ativado após verifySetup).
   */
  async beginSetup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });
    if (!user) throw new UnauthorizedException();
    if (user.mfaEnabled) throw new BadRequestException('MFA já está ativo.');

    const secret = base32Encode(randomBytes(20));
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret, mfaEnabled: false },
    });

    const issuer = process.env.MFA_ISSUER || 'Vitalle';
    const label = encodeURIComponent(`${issuer}:${user.email}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30',
    });
    const otpauthUri = `otpauth://totp/${label}?${params.toString()}`;
    return { secret, otpauthUri };
  }

  async verifySetup(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });
    if (!user?.mfaSecret) throw new BadRequestException('Setup não iniciado.');
    if (!verifyTotpCode(user.mfaSecret, code)) {
      throw new UnauthorizedException('Código inválido.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
    return { ok: true };
  }

  async disable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });
    if (!user?.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA não está ativo.');
    }
    if (!verifyTotpCode(user.mfaSecret, code)) {
      throw new UnauthorizedException('Código inválido.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });
    return { ok: true };
  }

  async verifyLoginCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });
    if (!user?.mfaSecret) return false;
    return verifyTotpCode(user.mfaSecret, code);
  }
}
