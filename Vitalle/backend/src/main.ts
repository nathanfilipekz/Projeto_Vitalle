import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PrismaService } from './providers/prisma/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filter, interceptor e guard JWT (com @Public() para rotas livres)
  app.useGlobalFilters(new GlobalExceptionFilter());
  const reflector = app.get(Reflector);
  const prisma = app.get(PrismaService);
  app.useGlobalInterceptors(new AuditInterceptor(prisma));
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Vitalle API')
    .setDescription('Vitalle Medical Concierge Platform - API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('health', 'Health check')
    .addTag('tenants', 'Tenant management')
    .addTag('users', 'User management')
    .addTag('doctors', 'Doctor management')
    .addTag('patients', 'Patient management')
    .addTag('appointments', 'Appointment scheduling')
    .addTag('medical-records', 'Medical records management')
    .addTag('anamnesis', 'Anamnesis management')
    .addTag('evolution', 'Patient evolution tracking')
    .addTag('subscriptions', 'Subscription management')
    .addTag('payments', 'Payment processing')
    .addTag('invoices', 'Invoice management')
    .addTag('whatsapp', 'WhatsApp Business integration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`Health check at http://localhost:${port}/api/v1/health`);
}
bootstrap();
