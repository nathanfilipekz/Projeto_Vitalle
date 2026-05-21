import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException('Empresa não encontrada');
    return tenant;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
    ]);
    return { data: tenants, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async update(id: string, data: { name?: string; phone?: string; logoUrl?: string }) {
    return this.prisma.tenant.update({ where: { id }, data });
  }
}
