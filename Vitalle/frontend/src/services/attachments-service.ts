import { supabase } from '@/lib/supabase';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AttachmentRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  created_at: string;
  deleted_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function fileCategory(mimeType: string): 'image' | 'pdf' | 'video' | 'doc' | 'other' {
  if (mimeType.startsWith('image/'))  return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/'))  return 'video';
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) return 'doc';
  return 'other';
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listAttachments(
  tenantId: string,
  patientId: string,
): Promise<AttachmentRow[]> {
  const { data, error } = await supabase
    .from('patient_attachments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as AttachmentRow[];
}

export async function uploadAttachment(
  tenantId: string,
  patientId: string,
  file: File,
): Promise<AttachmentRow> {
  const ext        = file.name.split('.').pop() ?? '';
  const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${tenantId}/${patientId}/${Date.now()}_${safeName}`;

  // 1. Upload ao Storage
  const { error: uploadError } = await supabase.storage
    .from('patient-attachments')
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  // 2. URL pública
  const { data: urlData } = supabase.storage
    .from('patient-attachments')
    .getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // 3. Salvar metadados
  const { data, error: insertError } = await supabase
    .from('patient_attachments')
    .insert({
      tenant_id:    tenantId,
      patient_id:   patientId,
      file_name:    file.name,
      file_type:    file.type,
      file_size:    file.size,
      storage_path: storagePath,
      public_url:   publicUrl,
    })
    .select('*')
    .single();
  if (insertError || !data) throw new Error(insertError?.message || 'Falha ao salvar metadados.');
  return data as AttachmentRow;
}

export async function deleteAttachment(
  attachment: AttachmentRow,
  tenantId: string,
): Promise<void> {
  // Remove do Storage
  await supabase.storage
    .from('patient-attachments')
    .remove([attachment.storage_path]);

  // Soft delete na tabela
  const { error } = await supabase
    .from('patient_attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', attachment.id)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
}
