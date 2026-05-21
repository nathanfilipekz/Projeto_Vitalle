import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    return this.prisma.doctor.findMany({
      where: { tenantId, deletedAt: null },
      include: { user: { select: { name: true, email: true, phone: true, avatarUrl: true } } },
    });
  }

  async findById(id: string, tenantId: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { user: true },
    });
    if (!doctor) throw new NotFoundException('Médico não encontrado');
    return doctor;
  }

  async getAvailableSlots(doctorId: string, tenantId: string, date: string) {
    const doctor = await this.findById(doctorId, tenantId);
    const dayOfWeek = new Date(date).getDay();

    if (!doctor.workingDays.includes(dayOfWeek)) {
      return [];
    }

    const startHour = parseInt(doctor.workingHoursStart.split(':')[0]);
    const endHour = parseInt(doctor.workingHoursEnd.split(':')[0]);
    const duration = doctor.consultationDuration;

    // Get existing appointments for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        tenantId,
        dateTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELED'] },
      },
    });

    const bookedTimes = appointments.map((a) => a.dateTime.toISOString());
    const slots: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += duration) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, min, 0, 0);
        
        if (!bookedTimes.includes(slotTime.toISOString())) {
          slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
      }
    }

    return slots;
  }
}
