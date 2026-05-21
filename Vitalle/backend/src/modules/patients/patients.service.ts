import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePatientDto) {
    const existing = await this.prisma.patient.findFirst({
      where: { cpf: dto.cpf, tenantId },
    });
    if (existing) throw new ConflictException('Paciente com este CPF já cadastrado');

    return this.prisma.patient.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId, deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async update(id: string, tenantId: string, data: Partial<CreatePatientDto>) {
    await this.findById(id, tenantId);
    return this.prisma.patient.update({ where: { id }, data });
  }

  async softDelete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
