# Arquitetura - Vitalle

## Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│           Next.js 14 (App Router)                   │
│     TailwindCSS + Shadcn/UI + Zustand              │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────┐
│                    BACKEND                           │
│              NestJS (Clean Architecture)             │
│   Guards │ Interceptors │ Pipes │ Filters           │
├─────────────────────────────────────────────────────┤
│  Modules:                                           │
│  Auth │ Tenants │ Users │ Doctors │ Patients        │
│  Appointments │ Medical Records │ Anamnesis         │
│  Evolution │ Subscriptions │ Payments │ Invoices    │
│  WhatsApp │ Contracts                               │
├─────────────────────────────────────────────────────┤
│  Providers:                                         │
│  Prisma │ PagBank │ WhatsApp │ NFe │ Supabase      │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  DATABASE                            │
│         PostgreSQL (Supabase) + RLS                  │
│         14 tables with tenant_id isolation           │
└─────────────────────────────────────────────────────┘
```

## Multi-Tenant Strategy

- **Discriminator Column**: Cada tabela possui `tenant_id UUID NOT NULL`
- **Application-Level Enforcement**: Guards no NestJS injetam `tenantId` em toda query
- **Database-Level Enforcement**: Row Level Security (RLS) no PostgreSQL
- **Double Protection**: Aplicação + banco garantem isolamento total

## Clean Architecture Layers

```
Controller → Service → Repository (Prisma)
     ↓           ↓           ↓
   DTOs      Business     Database
  (Input)     Logic       Access
```

## Security Layers

1. **Transport**: HTTPS + Helmet headers
2. **Authentication**: JWT + MFA + Refresh Token rotation
3. **Authorization**: Role-based (SUPPORT/MANAGER/DOCTOR) + Tenant isolation
4. **Validation**: class-validator + whitelist + forbidNonWhitelisted
5. **Rate Limiting**: ThrottlerModule (100 req/60s default)
6. **Audit**: AuditInterceptor logs all mutations
7. **Database**: RLS + soft delete + encrypted sensitive fields

## Escalabilidade Futura

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Payment      │  │ WhatsApp     │  │ AI           │
│ Microservice │  │ Microservice │  │ Microservice │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                   ┌──────▼──────┐
                   │   Message   │
                   │    Queue    │
                   │   (Redis)   │
                   └─────────────┘
```

Preparado para separação em microserviços com:
- Redis para filas e cache
- Event-driven communication
- Workers independentes
