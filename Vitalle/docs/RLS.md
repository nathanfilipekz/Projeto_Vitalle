# Row Level Security (RLS) - Vitalle

## Configuração no Supabase

### Habilitar RLS em todas as tabelas
```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
```

### Políticas de acesso

```sql
-- Users: só vê dados do próprio tenant
CREATE POLICY "users_tenant_isolation" ON users
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Patients: só vê pacientes do próprio tenant
CREATE POLICY "patients_tenant_isolation" ON patients
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Appointments: só vê consultas do próprio tenant
CREATE POLICY "appointments_tenant_isolation" ON appointments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Medical Records: só vê prontuários do próprio tenant
CREATE POLICY "medical_records_tenant_isolation" ON medical_records
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Patient Evolutions: só vê evoluções do próprio tenant
CREATE POLICY "patient_evolutions_tenant_isolation" ON patient_evolutions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Subscriptions: só vê assinatura do próprio tenant
CREATE POLICY "subscriptions_tenant_isolation" ON subscriptions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Payments: só vê pagamentos do próprio tenant
CREATE POLICY "payments_tenant_isolation" ON payments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- WhatsApp Messages: só vê mensagens do próprio tenant
CREATE POLICY "whatsapp_tenant_isolation" ON whatsapp_messages
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Audit Logs: só vê logs do próprio tenant
CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Service Role (Backend)

O backend usa `service_role` key que bypassa RLS.
A proteção no nível de aplicação é garantida pelos Guards (TenantGuard).

Dupla camada de segurança:
1. **Application Layer**: TenantGuard injeta `tenantId` do JWT
2. **Database Layer**: RLS policies aplicadas para conexões diretas
