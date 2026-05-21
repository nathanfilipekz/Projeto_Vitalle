import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { WhatsAppService } from './whatsapp.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly configService: ConfigService,
  ) {}

  @Post('send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Send WhatsApp message' })
  async send(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { to: string; message: string; patientId?: string },
  ) {
    return this.whatsAppService.sendMessage(body.to, body.message, user.tenantId, body.patientId);
  }

  @Get('webhook')
  @Public()
  @ApiOperation({ summary: 'WhatsApp webhook verification' })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return parseInt(challenge);
    }
    return 'Forbidden';
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'WhatsApp inbound webhook' })
  async handleWebhook(@Body() payload: any) {
    await this.whatsAppService.processInboundMessage(payload);
    return { status: 'ok' };
  }
}
