-- ============================================================
-- Baseline migration 0_init
-- Gerado manualmente a partir de prisma/schema.prisma
-- Data: 21/05/2026
-- ============================================================

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPPORT', 'MANAGER', 'DOCTOR');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_CONTRACT_ACCEPT', 'ACTIVE', 'SUSPENDED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STANDARD', 'PLUS');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'ISSUED', 'CANCELED', 'ERROR');

-- CreateEnum
CREATE TYPE "WhatsAppMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- ============================================================
-- CreateTable: tenants
-- ============================================================
CREATE TABLE "tenants" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "name"       TEXT        NOT NULL,
    "document"   TEXT        NOT NULL,
    "email"      TEXT        NOT NULL,
    "phone"      TEXT,
    "logo_url"   TEXT,
    "is_active"  BOOLEAN     NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: users
-- ============================================================
CREATE TABLE "users" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"     UUID        NOT NULL,
    "email"         TEXT        NOT NULL,
    "password_hash" TEXT        NOT NULL,
    "name"          TEXT        NOT NULL,
    "role"          "UserRole"  NOT NULL,
    "phone"         TEXT,
    "avatar_url"    TEXT,
    "is_active"     BOOLEAN     NOT NULL DEFAULT true,
    "mfa_enabled"   BOOLEAN     NOT NULL DEFAULT false,
    "mfa_secret"    TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,
    "deleted_at"    TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: refresh_tokens
-- ============================================================
CREATE TABLE "refresh_tokens" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"    UUID        NOT NULL,
    "token"      TEXT        NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: doctors
-- ============================================================
CREATE TABLE "doctors" (
    "id"                    UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"             UUID        NOT NULL,
    "user_id"               UUID        NOT NULL,
    "crm"                   TEXT        NOT NULL,
    "specialty"             TEXT        NOT NULL,
    "bio"                   TEXT,
    "consultation_duration" INTEGER     NOT NULL DEFAULT 30,
    "working_hours_start"   TEXT        NOT NULL DEFAULT '08:00',
    "working_hours_end"     TEXT        NOT NULL DEFAULT '18:00',
    "working_days"          INTEGER[]   NOT NULL DEFAULT ARRAY[1,2,3,4,5]::INTEGER[],
    "is_active"             BOOLEAN     NOT NULL DEFAULT true,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL,
    "deleted_at"            TIMESTAMP(3),

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: managers
-- ============================================================
CREATE TABLE "managers" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"  UUID        NOT NULL,
    "user_id"    UUID        NOT NULL,
    "is_active"  BOOLEAN     NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "managers_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: patients
-- ============================================================
CREATE TABLE "patients" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"     UUID        NOT NULL,
    "name"          TEXT        NOT NULL,
    "cpf"           TEXT        NOT NULL,
    "email"         TEXT,
    "phone"         TEXT        NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender"        TEXT,
    "address"       TEXT,
    "city"          TEXT,
    "state"         TEXT,
    "zip_code"      TEXT,
    "blood_type"    TEXT,
    "allergies"     TEXT,
    "notes"         TEXT,
    "avatar_url"    TEXT,
    "is_active"     BOOLEAN     NOT NULL DEFAULT true,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,
    "deleted_at"    TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: appointments
-- ============================================================
CREATE TABLE "appointments" (
    "id"            UUID               NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"     UUID               NOT NULL,
    "doctor_id"     UUID               NOT NULL,
    "patient_id"    UUID               NOT NULL,
    "date_time"     TIMESTAMP(3)       NOT NULL,
    "duration"      INTEGER            NOT NULL DEFAULT 30,
    "status"        "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "type"          TEXT,
    "notes"         TEXT,
    "cancel_reason" TEXT,
    "confirmed_at"  TIMESTAMP(3),
    "completed_at"  TIMESTAMP(3),
    "created_at"    TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3)       NOT NULL,
    "deleted_at"    TIMESTAMP(3),

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: medical_records
-- ============================================================
CREATE TABLE "medical_records" (
    "id"                       UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"                UUID        NOT NULL,
    "patient_id"               UUID        NOT NULL,
    "doctor_id"                UUID        NOT NULL,
    "chief_complaint"          TEXT,
    "history_present_illness"  TEXT,
    "past_medical_history"     TEXT,
    "family_history"           TEXT,
    "social_history"           TEXT,
    "review_of_systems"        TEXT,
    "physical_examination"     TEXT,
    "assessment"               TEXT,
    "plan"                     TEXT,
    "diagnosis"                TEXT,
    "prescription"             TEXT,
    "attachments"              TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3) NOT NULL,
    "deleted_at"               TIMESTAMP(3),

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: patient_evolutions
-- ============================================================
CREATE TABLE "patient_evolutions" (
    "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"    UUID        NOT NULL,
    "patient_id"   UUID        NOT NULL,
    "doctor_id"    UUID        NOT NULL,
    "title"        TEXT        NOT NULL,
    "description"  TEXT        NOT NULL,
    "observations" TEXT,
    "images"       TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "attachments"  TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,
    "deleted_at"   TIMESTAMP(3),

    CONSTRAINT "patient_evolutions_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: subscriptions
-- ============================================================
CREATE TABLE "subscriptions" (
    "id"             UUID                NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"      UUID                NOT NULL,
    "plan"           "SubscriptionPlan"  NOT NULL,
    "billing_cycle"  "BillingCycle"      NOT NULL,
    "status"         "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "price_monthly"  DECIMAL(10,2)       NOT NULL,
    "price_total"    DECIMAL(10,2)       NOT NULL,
    "discount"       DECIMAL(5,2),
    "start_date"     TIMESTAMP(3),
    "end_date"       TIMESTAMP(3),
    "canceled_at"    TIMESTAMP(3),
    "created_at"     TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3)        NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: payments
-- ============================================================
CREATE TABLE "payments" (
    "id"              UUID            NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"       UUID            NOT NULL,
    "subscription_id" UUID            NOT NULL,
    "external_id"     TEXT,
    "amount"          DECIMAL(10,2)   NOT NULL,
    "method"          "PaymentMethod" NOT NULL,
    "status"          "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at"         TIMESTAMP(3),
    "pix_code"        TEXT,
    "pix_qr_code"     TEXT,
    "card_last_four"  TEXT,
    "webhook_payload" JSONB,
    "created_at"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: invoices
-- ============================================================
CREATE TABLE "invoices" (
    "id"            UUID            NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"     UUID            NOT NULL,
    "payment_id"    UUID            NOT NULL,
    "external_id"   TEXT,
    "number"        TEXT,
    "status"        "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "pdf_url"       TEXT,
    "xml_url"       TEXT,
    "issued_at"     TIMESTAMP(3),
    "email_sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: contract_acceptances
-- ============================================================
CREATE TABLE "contract_acceptances" (
    "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"        UUID        NOT NULL,
    "user_id"          UUID        NOT NULL,
    "contract_version" TEXT        NOT NULL,
    "contract_hash"    TEXT        NOT NULL,
    "ip_address"       TEXT        NOT NULL,
    "user_agent"       TEXT        NOT NULL,
    "accepted_at"      TIMESTAMP(3) NOT NULL,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_acceptances_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: whatsapp_messages
-- ============================================================
CREATE TABLE "whatsapp_messages" (
    "id"            UUID                       NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"     UUID                       NOT NULL,
    "patient_id"    UUID,
    "direction"     "WhatsAppMessageDirection"  NOT NULL,
    "status"        "WhatsAppMessageStatus"     NOT NULL DEFAULT 'SENT',
    "from"          TEXT                       NOT NULL,
    "to"            TEXT                       NOT NULL,
    "body"          TEXT                       NOT NULL,
    "template_name" TEXT,
    "external_id"   TEXT,
    "sent_at"       TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at"  TIMESTAMP(3),
    "read_at"       TIMESTAMP(3),
    "failed_reason" TEXT,
    "created_at"    TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: audit_logs
-- ============================================================
CREATE TABLE "audit_logs" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"  UUID        NOT NULL,
    "user_id"    UUID,
    "action"     TEXT        NOT NULL,
    "entity"     TEXT        NOT NULL,
    "entity_id"  TEXT,
    "old_data"   JSONB,
    "new_data"   JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- Unique Indexes
-- ============================================================
CREATE UNIQUE INDEX "tenants_document_key"       ON "tenants"("document");
CREATE UNIQUE INDEX "users_email_tenant_id_key"  ON "users"("email", "tenant_id");
CREATE UNIQUE INDEX "refresh_tokens_token_key"   ON "refresh_tokens"("token");
CREATE UNIQUE INDEX "doctors_user_id_key"        ON "doctors"("user_id");
CREATE UNIQUE INDEX "managers_user_id_key"       ON "managers"("user_id");
CREATE UNIQUE INDEX "patients_cpf_tenant_id_key" ON "patients"("cpf", "tenant_id");
CREATE UNIQUE INDEX "invoices_payment_id_key"    ON "invoices"("payment_id");

-- ============================================================
-- Regular Indexes
-- ============================================================
CREATE INDEX "users_tenant_id_idx"                    ON "users"("tenant_id");
CREATE INDEX "users_email_idx"                        ON "users"("email");
CREATE INDEX "refresh_tokens_user_id_idx"             ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_token_idx"               ON "refresh_tokens"("token");
CREATE INDEX "doctors_tenant_id_idx"                  ON "doctors"("tenant_id");
CREATE INDEX "doctors_crm_idx"                        ON "doctors"("crm");
CREATE INDEX "managers_tenant_id_idx"                 ON "managers"("tenant_id");
CREATE INDEX "patients_tenant_id_idx"                 ON "patients"("tenant_id");
CREATE INDEX "patients_phone_idx"                     ON "patients"("phone");
CREATE INDEX "patients_name_idx"                      ON "patients"("name");
CREATE INDEX "appointments_tenant_id_idx"             ON "appointments"("tenant_id");
CREATE INDEX "appointments_doctor_id_idx"             ON "appointments"("doctor_id");
CREATE INDEX "appointments_patient_id_idx"            ON "appointments"("patient_id");
CREATE INDEX "appointments_date_time_idx"             ON "appointments"("date_time");
CREATE INDEX "appointments_status_idx"                ON "appointments"("status");
CREATE INDEX "medical_records_tenant_id_idx"          ON "medical_records"("tenant_id");
CREATE INDEX "medical_records_patient_id_idx"         ON "medical_records"("patient_id");
CREATE INDEX "medical_records_doctor_id_idx"          ON "medical_records"("doctor_id");
CREATE INDEX "patient_evolutions_tenant_id_idx"       ON "patient_evolutions"("tenant_id");
CREATE INDEX "patient_evolutions_patient_id_idx"      ON "patient_evolutions"("patient_id");
CREATE INDEX "patient_evolutions_created_at_idx"      ON "patient_evolutions"("created_at");
CREATE INDEX "subscriptions_tenant_id_idx"            ON "subscriptions"("tenant_id");
CREATE INDEX "subscriptions_status_idx"               ON "subscriptions"("status");
CREATE INDEX "payments_tenant_id_idx"                 ON "payments"("tenant_id");
CREATE INDEX "payments_external_id_idx"               ON "payments"("external_id");
CREATE INDEX "payments_status_idx"                    ON "payments"("status");
CREATE INDEX "invoices_tenant_id_idx"                 ON "invoices"("tenant_id");
CREATE INDEX "invoices_status_idx"                    ON "invoices"("status");
CREATE INDEX "contract_acceptances_tenant_id_idx"     ON "contract_acceptances"("tenant_id");
CREATE INDEX "contract_acceptances_user_id_idx"       ON "contract_acceptances"("user_id");
CREATE INDEX "whatsapp_messages_tenant_id_idx"        ON "whatsapp_messages"("tenant_id");
CREATE INDEX "whatsapp_messages_patient_id_idx"       ON "whatsapp_messages"("patient_id");
CREATE INDEX "whatsapp_messages_external_id_idx"      ON "whatsapp_messages"("external_id");
CREATE INDEX "audit_logs_tenant_id_idx"               ON "audit_logs"("tenant_id");
CREATE INDEX "audit_logs_user_id_idx"                 ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_action_idx"                  ON "audit_logs"("action");
CREATE INDEX "audit_logs_entity_idx"                  ON "audit_logs"("entity");
CREATE INDEX "audit_logs_created_at_idx"              ON "audit_logs"("created_at");

-- ============================================================
-- Foreign Keys
-- ============================================================
ALTER TABLE "users"
    ADD CONSTRAINT "users_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "doctors"
    ADD CONSTRAINT "doctors_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "doctors"
    ADD CONSTRAINT "doctors_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "managers"
    ADD CONSTRAINT "managers_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "managers"
    ADD CONSTRAINT "managers_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patients"
    ADD CONSTRAINT "patients_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
    ADD CONSTRAINT "appointments_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
    ADD CONSTRAINT "appointments_doctor_id_fkey"
    FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "medical_records"
    ADD CONSTRAINT "medical_records_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "medical_records"
    ADD CONSTRAINT "medical_records_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "medical_records"
    ADD CONSTRAINT "medical_records_doctor_id_fkey"
    FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_evolutions"
    ADD CONSTRAINT "patient_evolutions_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_evolutions"
    ADD CONSTRAINT "patient_evolutions_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_evolutions"
    ADD CONSTRAINT "patient_evolutions_doctor_id_fkey"
    FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "contract_acceptances"
    ADD CONSTRAINT "contract_acceptances_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "contract_acceptances"
    ADD CONSTRAINT "contract_acceptances_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
