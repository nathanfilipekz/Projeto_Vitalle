export interface Tenant {
  id: string;
  name: string;
  document: string;
  email: string;
  phone?: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'SUPPORT' | 'MANAGER' | 'DOCTOR';
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  tenantId: string;
  userId: string;
  crm: string;
  specialty: string;
  bio?: string;
  consultationDuration: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  user?: User;
}

export interface Patient {
  id: string;
  tenantId: string;
  name: string;
  cpf: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bloodType?: string;
  allergies?: string;
  notes?: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELED' | 'RESCHEDULED' | 'COMPLETED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  tenantId: string;
  doctorId: string;
  patientId: string;
  dateTime: string;
  duration: number;
  status: AppointmentStatus;
  type?: string;
  notes?: string;
  doctor?: Doctor;
  patient?: Patient;
}

export interface MedicalRecord {
  id: string;
  tenantId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint?: string;
  historyPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  reviewOfSystems?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  diagnosis?: string;
  prescription?: string;
  attachments: string[];
  createdAt: string;
}

export interface PatientEvolution {
  id: string;
  tenantId: string;
  patientId: string;
  doctorId: string;
  title: string;
  description: string;
  observations?: string;
  images: string[];
  attachments: string[];
  createdAt: string;
}

export type SubscriptionPlan = 'STANDARD' | 'PLUS';
export type SubscriptionStatus = 'PENDING_PAYMENT' | 'PENDING_CONTRACT_ACCEPT' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED' | 'EXPIRED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface Subscription {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  priceMonthly: number;
  priceTotal: number;
  discount?: number;
  startDate?: string;
  endDate?: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  subscriptionId: string;
  amount: number;
  method: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED' | 'CANCELED';
  paidAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
