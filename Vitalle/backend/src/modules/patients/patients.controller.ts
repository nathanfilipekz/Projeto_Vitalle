import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create patient' })
  async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List patients' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll(user.tenantId, page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.patientsService.findById(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: Partial<CreatePatientDto>,
  ) {
    return this.patientsService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete patient' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.patientsService.softDelete(id, user.tenantId);
  }
}
