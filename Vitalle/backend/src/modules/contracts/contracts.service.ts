import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import * as crypto from 'crypto';

const CONTRACT_VERSION = '1.0.0';
const CONTRACT_CONTENT = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS SAAS - VITALLE

1. OBJETO
Este contrato regula a utilização da plataforma Vitalle para gestão de consultórios médicos.

2. RESPONSABILIDADES
2.1. A plataforma Vitalle é uma ferramenta tecnológica de apoio administrativo.
2.2. A empresa NÃO presta serviço médico.
2.3. O cliente é responsável pelos dados inseridos na plataforma.
2.4. O cliente é responsável pelo consentimento dos seus pacientes.

3. LGPD
3.1. A plataforma atua como operadora de dados pessoais.
3.2. O cliente é o controlador dos dados de seus pacientes.
3.3. Dados sensíveis de saúde são tratados com segurança reforçada.

4. DISPONIBILIDADE
4.1. Integrações externas (WhatsApp, PagBank, NFe) podem sofrer indisponibilidade.
4.2. A plataforma não se responsabiliza por falhas de terceiros.

5. LIMITAÇÃO DE RESPONSABILIDADE
5.1. A responsabilidade da plataforma é limitada ao valor pago pelo cliente.
5.2. A plataforma não se responsabiliza por decisões médicas baseadas no sistema.

6. PROPRIEDADE INTELECTUAL
6.1. Todo código e design pertence à Vitalle.
6.2. Os dados do cliente pertencem exclusivamente ao cliente.

7. ACEITE DIGITAL
7.1. O aceite eletrônico possui validade jurídica equivalente a assinatura eletrônica simples.
7.2. São registrados: IP, data/hora, navegador e versão contratual.
`;

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  getContractContent() {
    return {
      version: CONTRACT_VERSION,
      content: CONTRACT_CONTENT,
      hash: this.generateHash(CONTRACT_CONTENT),
    };
  }

  async acceptContract(
    tenantId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const contractHash = this.generateHash(CONTRACT_CONTENT);

    const acceptance = await this.prisma.contractAcceptance.create({
      data: {
        tenantId,
        userId,
        contractVersion: CONTRACT_VERSION,
        contractHash,
        ipAddress,
        userAgent,
        acceptedAt: new Date(),
      },
    });

    // Activate subscription
    await this.prisma.subscription.updateMany({
      where: { tenantId, status: 'PENDING_CONTRACT_ACCEPT' },
      data: { status: 'ACTIVE' },
    });

    // Audit
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'CONTRACT_ACCEPTED',
        entity: 'contract_acceptance',
        entityId: acceptance.id,
        ipAddress,
        userAgent,
      },
    });

    return { message: 'Contrato aceito com sucesso', acceptance };
  }

  async hasAcceptedContract(userId: string, tenantId: string) {
    const acceptance = await this.prisma.contractAcceptance.findFirst({
      where: { userId, tenantId, contractVersion: CONTRACT_VERSION },
    });
    return !!acceptance;
  }

  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
