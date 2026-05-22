'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, Upload, FileText, Film, FileImage,
  File, Trash2, Download, X, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  formatFileSize,
  fileCategory,
  AttachmentRow,
} from '@/services/attachments-service';

// ─── helpers ──────────────────────────────────────────────────────────────────

const ACCEPT = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'video/mp4', 'video/quicktime', 'video/avi',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',');

function FileIcon({ mimeType, className = 'w-8 h-8' }: { mimeType: string; className?: string }) {
  const cat = fileCategory(mimeType);
  if (cat === 'image') return <FileImage className={`${className} text-blue-400`} />;
  if (cat === 'pdf')   return <FileText  className={`${className} text-red-400`} />;
  if (cat === 'video') return <Film      className={`${className} text-purple-400`} />;
  if (cat === 'doc')   return <FileText  className={`${className} text-blue-600`} />;
  return <File className={`${className} text-[#406B5B]/40`} />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Lightbox simples para imagens ───────────────────────────────────────────

function ImageLightbox({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={url}
        alt={name}
        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Card de anexo ────────────────────────────────────────────────────────────

function AttachmentCard({
  attachment, onDelete,
}: {
  attachment: AttachmentRow;
  onDelete: (a: AttachmentRow) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [lightbox, setLightbox]     = useState(false);
  const cat = fileCategory(attachment.file_type);
  const isImage = cat === 'image';

  return (
    <>
      <div className="group relative border border-[#E4D5C3] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md hover:border-[#406B5B]/30 transition-all">

        {/* Área de preview / ícone */}
        <div
          className={`h-36 flex items-center justify-center bg-[#F7F3EE] border-b border-[#E4D5C3] ${isImage ? 'cursor-pointer' : ''}`}
          onClick={() => isImage && setLightbox(true)}
        >
          {isImage ? (
            <>
              <img
                src={attachment.public_url}
                alt={attachment.file_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="w-8 h-8 text-white drop-shadow" />
              </div>
            </>
          ) : (
            <FileIcon mimeType={attachment.file_type} className="w-12 h-12" />
          )}
        </div>

        {/* Info */}
        <div className="px-3 py-2.5">
          <p className="text-xs font-semibold text-[#406B5B] truncate" title={attachment.file_name}>
            {attachment.file_name}
          </p>
          <p className="text-[10px] text-[#406B5B]/40 mt-0.5">
            {formatFileSize(attachment.file_size)} · {formatDate(attachment.created_at)}
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between px-3 pb-3 gap-2">
          <a
            href={attachment.public_url}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.file_name}
            className="flex items-center gap-1 text-[10px] text-[#406B5B]/60 hover:text-[#406B5B] transition-colors font-medium"
          >
            <Download className="w-3 h-3" /> Baixar
          </a>

          {!confirmDel ? (
            <button
              onClick={() => setConfirmDel(true)}
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Excluir
            </button>
          ) : (
            <span className="flex items-center gap-1.5">
              <button
                onClick={() => onDelete(attachment)}
                className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="text-[10px] text-[#406B5B]/40 hover:text-[#406B5B]"
              >
                Cancelar
              </button>
            </span>
          )}
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          url={attachment.public_url}
          name={attachment.file_name}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────

interface AnexosTabProps {
  tenantId: string;
  patientId: string;
}

export function AnexosTab({ tenantId, patientId }: AnexosTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [dragOver, setDragOver]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setAttachments(await listAttachments(tenantId, patientId)); }
    catch   { setAttachments([]); }
    finally { setLoading(false); }
  }, [tenantId, patientId]);

  useEffect(() => { load(); }, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const results: AttachmentRow[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`${file.name}: arquivo muito grande (máx 50 MB)`);
        continue;
      }
      try {
        const row = await uploadAttachment(tenantId, patientId, file);
        results.push(row);
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : 'erro'}`);
      }
    }

    if (results.length > 0) {
      setAttachments((prev) => [...results, ...prev]);
      toast.success(`${results.length} arquivo${results.length !== 1 ? 's' : ''} enviado${results.length !== 1 ? 's' : ''} com sucesso.`);
    }
    errors.forEach((e) => toast.error(e));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDelete = async (attachment: AttachmentRow) => {
    try {
      await deleteAttachment(attachment, tenantId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      toast.success('Anexo removido.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover anexo.');
    }
  };

  // Drag & Drop
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = ()                      => setDragOver(false);
  const onDrop      = (e: React.DragEvent)   => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-5">

      {/* Zona de upload */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragOver
            ? 'border-[#406B5B] bg-[#406B5B]/5'
            : 'border-[#E4D5C3] bg-[#F7F3EE]/60 hover:border-[#406B5B]/40 hover:bg-[#F7F3EE]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-[#406B5B] animate-spin" />
            <p className="text-sm font-medium text-[#406B5B]">Enviando arquivos...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[#406B5B]/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#406B5B]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#406B5B]">
                {dragOver ? 'Solte os arquivos aqui' : 'Clique para anexar ou arraste os arquivos'}
              </p>
              <p className="text-xs text-[#406B5B]/40 mt-1">
                Imagens, PDF, vídeos e documentos · Máx. 50 MB por arquivo
              </p>
            </div>
          </>
        )}
      </div>

      {/* Contagem */}
      {!loading && attachments.length > 0 && (
        <p className="text-xs text-[#406B5B]/50 font-medium">
          {attachments.length} arquivo{attachments.length !== 1 ? 's' : ''} anexado{attachments.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-[#406B5B]/30" />
        </div>
      ) : attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#406B5B]/25 gap-3">
          <FileImage className="w-12 h-12" />
          <p className="text-sm">Nenhum arquivo anexado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {attachments.map((a) => (
            <AttachmentCard key={a.id} attachment={a} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
