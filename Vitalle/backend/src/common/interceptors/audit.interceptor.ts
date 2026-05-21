import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    // Only audit mutating operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async (response) => {
          if (user?.tenantId) {
            try {
              await this.prisma.auditLog.create({
                data: {
                  tenantId: user.tenantId,
                  userId: user.id,
                  action: `${method} ${url}`,
                  entity: this.extractEntity(url),
                  entityId: response?.id || null,
                  ipAddress: ip,
                  userAgent: headers['user-agent'],
                },
              });
            } catch (error) {
              // Non-blocking: don't fail the request if audit fails
              console.error('Audit log failed:', error);
            }
          }
        }),
      );
    }

    return next.handle();
  }

  private extractEntity(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'unknown';
  }
}
