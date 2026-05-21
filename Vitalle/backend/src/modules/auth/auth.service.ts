import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email, deletedAt: null },
      include: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desativada');
    }

    // Se MFA está ativo, NÃO emite tokens agora — devolve requiresMfa.
    if (user.mfaEnabled) {
      return {
        requiresMfa: true,
        userId: user.id,
        email: user.email,
      };
    }

    return this.finalizeLogin(user.id, user.tenantId, user.role, ipAddress, userAgent);
  }

  async completeMfaLogin(userId: string, code: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA não configurado.');
    }
    // Importa de forma "lazy" para evitar dependência circular se MfaService crescer.
    // Aqui validamos inline reaproveitando a mesma lógica (RFC 6238).
    const { createHmac } = await import('crypto');
    const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const decode = (s: string): Buffer => {
      const clean = s.replace(/=+$/, '').toUpperCase();
      let bits = 0, val = 0;
      const out: number[] = [];
      for (const ch of clean) {
        const i = BASE32.indexOf(ch);
        if (i === -1) continue;
        val = (val << 5) | i; bits += 5;
        if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
      }
      return Buffer.from(out);
    };
    const check = (secret: string, c: string, window = 1): boolean => {
      const cleaned = (c || '').trim();
      if (!/^\d{6}$/.test(cleaned)) return false;
      const now = Math.floor(Date.now() / 1000);
      for (let i = -window; i <= window; i++) {
        const counter = Math.floor((now + i * 30) / 30);
        const buf = Buffer.alloc(8);
        buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
        buf.writeUInt32BE(counter >>> 0, 4);
        const hmac = createHmac('sha1', decode(secret)).update(buf).digest();
        const offset = hmac[hmac.length - 1] & 0x0f;
        const bin =
          ((hmac[offset] & 0x7f) << 24) |
          (hmac[offset + 1] << 16) |
          (hmac[offset + 2] << 8) |
          hmac[offset + 3];
        if ((bin % 1_000_000).toString().padStart(6, '0') === cleaned) return true;
      }
      return false;
    };
    if (!check(user.mfaSecret, code)) {
      throw new UnauthorizedException('Código MFA inválido.');
    }
    return this.finalizeLogin(user.id, user.tenantId, user.role, ipAddress, userAgent);
  }

  private async finalizeLogin(
    userId: string,
    tenantId: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'LOGIN',
        entity: 'user',
        entityId: userId,
        ipAddress,
        userAgent,
      },
    });
    const tokens = await this.generateTokens(userId, tenantId, role);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user!.id,
        name: user!.name,
        email: user!.email,
        role: user!.role,
        tenantId: user!.tenantId,
        avatarUrl: user!.avatarUrl,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: registerDto.clinicName,
          document: registerDto.document || '',
          email: registerDto.email,
          phone: registerDto.phone,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: registerDto.email,
          passwordHash,
          name: registerDto.name,
          role: 'DOCTOR',
          phone: registerDto.phone,
        },
      });

      // Create doctor profile
      await tx.doctor.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          crm: registerDto.crm || '',
          specialty: registerDto.specialty || 'Clínico Geral',
        },
      });

      // Create subscription (pending payment)
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: registerDto.plan || 'STANDARD',
          billingCycle: registerDto.billingCycle || 'MONTHLY',
          status: 'PENDING_PAYMENT',
          priceMonthly: registerDto.plan === 'PLUS' ? 397 : 197,
          priceTotal: registerDto.plan === 'PLUS' ? 397 : 197,
        },
      });

      return { tenant, user };
    });

    return {
      message: 'Conta criada com sucesso',
      tenantId: result.tenant.id,
      userId: result.user.id,
    };
  }

  async refreshToken(token: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken || refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      refreshToken.user.id,
      refreshToken.user.tenantId,
      refreshToken.user.role,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  private async generateTokens(userId: string, tenantId: string, role: string) {
    const payload = { sub: userId, tenantId, role };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
