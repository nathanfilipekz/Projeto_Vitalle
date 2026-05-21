import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current contract content' })
  async getContract() {
    return this.contractsService.getContractContent();
  }

  @Get('status')
  @ApiOperation({ summary: 'Check if user has accepted contract' })
  async getStatus(@CurrentUser() user: CurrentUserData) {
    const accepted = await this.contractsService.hasAcceptedContract(user.id, user.tenantId);
    return { accepted };
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept contract' })
  async accept(@CurrentUser() user: CurrentUserData, @Req() req: any) {
    return this.contractsService.acceptContract(
      user.tenantId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
