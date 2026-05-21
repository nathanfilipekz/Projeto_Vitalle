import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../providers/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL', 'https://graph.facebook.com/v18.0');
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '');
  }

  async sendMessage(to: string, body: string, tenantId: string, patientId?: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhone(to),
          type: 'text',
          text: { body },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      await this.prisma.whatsAppMessage.create({
        data: {
          tenantId,
          patientId,
          direction: 'OUTBOUND',
          from: this.phoneNumberId,
          to: this.formatPhone(to),
          body,
          externalId: response.data.messages?.[0]?.id,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
      throw error;
    }
  }

  async sendAppointmentReminder(
    patientName: string,
    patientPhone: string,
    appointmentTime: string,
    tenantId: string,
    patientId?: string,
  ) {
    const message = `Olá ${patientName}.\n\nSeu atendimento será amanhã às ${appointmentTime}.\n\nResponda:\n1 = Confirmar\n2 = Cancelar`;
    return this.sendMessage(patientPhone, message, tenantId, patientId);
  }

  async processInboundMessage(payload: any) {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return;

    const from = message.from;
    const body = message.text?.body?.toLowerCase().trim();

    // Find patient by phone
    const patient = await this.prisma.patient.findFirst({
      where: { phone: { contains: from.slice(-11) } },
    });

    if (!patient) return;

    // Store inbound message
    await this.prisma.whatsAppMessage.create({
      data: {
        tenantId: patient.tenantId,
        patientId: patient.id,
        direction: 'INBOUND',
        from,
        to: this.phoneNumberId,
        body: message.text?.body || '',
        externalId: message.id,
      },
    });

    // Process automated responses
    if (body === '1' || body === 'confirmar') {
      await this.confirmNextAppointment(patient.id, patient.tenantId);
    } else if (body === '2' || body === 'cancelar' || body === 'cancelamento') {
      await this.cancelNextAppointment(patient.id, patient.tenantId);
    }
  }

  private async confirmNextAppointment(patientId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        tenantId,
        status: 'SCHEDULED',
        dateTime: { gte: new Date() },
      },
      orderBy: { dateTime: 'asc' },
    });

    if (appointment) {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });
    }
  }

  private async cancelNextAppointment(patientId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        tenantId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        dateTime: { gte: new Date() },
      },
      orderBy: { dateTime: 'asc' },
    });

    if (appointment) {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELED', cancelReason: 'Cancelado pelo paciente via WhatsApp' },
      });

      // Notify about cancellation
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (patient) {
        await this.sendMessage(
          patient.phone,
          'Sua consulta foi cancelada com sucesso. Para reagendar, entre em contato.',
          tenantId,
          patientId,
        );
      }
    }
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  }
}
