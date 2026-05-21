import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../providers/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check (público) — usado por Cloud Run / Nginx' })
  async check() {
    let database = 'unknown';
    let dbLatencyMs: number | null = null;
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      database = 'ok';
    } catch (e) {
      database = 'down';
    }

    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      service: process.env.APP_NAME || 'Vitalle',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      database,
      dbLatencyMs,
    };
  }
}
