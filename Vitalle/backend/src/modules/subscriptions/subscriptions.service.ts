import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async activate(tenantId: string) {
    const subscription = await this.findByTenant(tenantId);
    if (!subscription) throw new NotFoundException('Assinatura não encontrada');

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PENDING_CONTRACT_ACCEPT',
        startDate: new Date(),
      },
    });
  }

  async acceptContract(tenantId: string) {
    const subscription = await this.findByTenant(tenantId);
    if (!subscription) throw new NotFoundException('Assinatura não encontrada');

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' },
    });
  }
}
