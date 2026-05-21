import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, doctorId: string, data: any) {
    return this.prisma.medicalRecord.create({
      data: { ...data, tenantId, doctorId },
    });
  }

  async findByPatient(patientId: string, tenantId: string) {
    return this.prisma.medicalRecord.findMany({
      where: { patientId, tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { doctor: { include: { user: { select: { name: true } } } } },
    });
  }

  async findById(id: string, tenantId: string) {
    const record = await this.prisma.medicalRecord.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { patient: true, doctor: { include: { user: true } } },
    });
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    return record;
  }
}
