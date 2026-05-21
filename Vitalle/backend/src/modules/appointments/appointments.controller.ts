import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create appointment' })
  async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List appointments' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.appointmentsService.findAll(user.tenantId, { doctorId, date, status, page, limit });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() body: { status: string },
  ) {
    return this.appointmentsService.updateStatus(id, user.tenantId, body.status as any);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() body: { reason?: string },
  ) {
    return this.appointmentsService.cancel(id, user.tenantId, body.reason);
  }
}
