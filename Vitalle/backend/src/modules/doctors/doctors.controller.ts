import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { DoctorsService } from './doctors.service';

@ApiTags('doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'List doctors in tenant' })
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.doctorsService.findByTenant(user.tenantId);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'Get available time slots for a doctor' })
  async getSlots(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getAvailableSlots(id, user.tenantId, date);
  }
}
