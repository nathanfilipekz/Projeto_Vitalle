import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { MedicalRecordsService } from './medical-records.service';

@ApiTags('medical-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create medical record' })
  async create(@CurrentUser() user: CurrentUserData, @Body() data: any) {
    return this.medicalRecordsService.create(user.tenantId, user.id, data);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get records by patient' })
  async findByPatient(@Param('patientId') patientId: string, @CurrentUser() user: CurrentUserData) {
    return this.medicalRecordsService.findByPatient(patientId, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medical record by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.medicalRecordsService.findById(id, user.tenantId);
  }
}
