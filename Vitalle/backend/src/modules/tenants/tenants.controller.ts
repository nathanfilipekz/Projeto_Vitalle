import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant info' })
  async getCurrent(@CurrentUser() user: CurrentUserData) {
    return this.tenantsService.findById(user.tenantId);
  }

  @Get()
  @Roles('SUPPORT')
  @ApiOperation({ summary: 'List all tenants (support only)' })
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Patch('current')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Update current tenant' })
  async updateCurrent(
    @CurrentUser() user: CurrentUserData,
    @Body() data: { name?: string; phone?: string; logoUrl?: string },
  ) {
    return this.tenantsService.update(user.tenantId, data);
  }
}
