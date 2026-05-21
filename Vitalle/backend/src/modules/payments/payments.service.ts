import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { subscription: true, invoice: true },
      }),
      this.prisma.payment.count({ where: { tenantId } }),
    ]);
    return { data: payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async processWebhook(payload: any) {
    // PagBank webhook processing
    const { reference_id, charges } = payload;
    if (!reference_id || !charges?.length) return;

    const charge = charges[0];
    const payment = await this.prisma.payment.findFirst({
      where: { externalId: reference_id },
    });

    if (!payment) return;

    const status = charge.status === 'PAID' ? 'APPROVED' : 
                   charge.status === 'DECLINED' ? 'DECLINED' : 'PENDING';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status,
        paidAt: status === 'APPROVED' ? new Date() : null,
        webhookPayload: payload,
      },
    });

    // If approved, activate subscription
    if (status === 'APPROVED') {
      await this.prisma.subscription.updateMany({
        where: { id: payment.subscriptionId },
        data: { status: 'PENDING_CONTRACT_ACCEPT' },
      });
    }
  }
}
