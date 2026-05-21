import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAppointmentDto) {
    const start = new Date(dto.dateTime);
    const duration = dto.duration || 30;
    const end = new Date(start.getTime() + duration * 60_000);

    // Detecção de SOBREPOSIÇÃO (não só horário exato): qualquer
    // consulta ativa do mesmo médico cujo intervalo intercepta
    // [start, end) é conflito. Cancelados / no-show / soft-deleted
    // são ignorados.
    //
    // Lógica: candidate.start < newEnd AND candidate.end > newStart,
    // onde candidate.end = candidate.start + candidate.duration min.
    // Como Prisma não calcula end_time dinamicamente, fazemos um
    // raw para usar a função appt_range já criada no banco (migration
    // 009). Em paralelo, a EXCLUDE constraint garante a integridade
    // mesmo em chamadas concorrentes.
    const conflicts = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM public.appointments
      WHERE tenant_id = ${tenantId}::uuid
        AND doctor_id = ${dto.doctorId}::uuid
        AND deleted_at IS NULL
        AND status NOT IN ('CANCELED', 'NO_SHOW')
        AND public.appt_range(date_time, duration)
            && tstzrange(${start}::timestamptz, ${end}::timestamptz, '[)')
      LIMIT 1
    `;

    if (conflicts.length > 0) {
      throw new BadRequestException(
        'Já existe uma consulta neste horário para este profissional. Escolha outro horário ou ajuste a duração.',
      );
    }

    try {
      return await this.prisma.appointment.create({
        data: {
          tenantId,
          doctorId: dto.doctorId,
          patientId: dto.patientId,
          dateTime: start,
          duration,
          type: dto.type,
          notes: dto.notes,
        },
        include: { patient: true, doctor: { include: { user: true } } },
      });
    } catch (err: any) {
      // Backup: a EXCLUDE constraint do Postgres dispara em corridas
      // concorrentes mesmo depois do check acima passar.
      if (
        err?.code === 'P2010' || // raw query error
        (typeof err?.message === 'string' &&
          err.message.includes('appointments_no_overlap_per_doctor'))
      ) {
        throw new BadRequestException(
          'Já existe uma consulta neste horário para este profissional. Escolha outro horário.',
        );
      }
      throw err;
    }
  }

  async findAll(tenantId: string, filters: { doctorId?: string; date?: string; status?: string; page?: number; limit?: number }) {
    const { doctorId, date, status, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;
    const where: any = { tenantId, deletedAt: null };

    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.dateTime = { gte: start, lte: end };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateTime: 'asc' },
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          doctor: { include: { user: { select: { name: true } } } },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data: appointments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateStatus(id: string, tenantId: string, status: AppointmentStatus) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });
    if (!appointment) throw new NotFoundException('Consulta não encontrada');

    const updateData: any = { status };
    if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
    });
  }

  async cancel(id: string, tenantId: string, reason?: string) {
    return this.updateStatus(id, tenantId, 'CANCELED');
  }
}
