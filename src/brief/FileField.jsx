import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, Paperclip, X, RotateCcw } from 'lucide-react';
import { FIELDS, formatBytes } from '../../shared/briefFields.js';
import { useBrief } from './context.js';
import { uploadFile, precheck, runQueue } from './upload.js';
import { WhatsAppEscape } from './WhatsAppEscape.jsx';
import { focusRing } from './TextFields.jsx';

const ICON = { grid: ImageIcon, hero: FileText, list: Paperclip };

/** "JPG, PNG ou WEBP · até 10 MB cada · até 20 fotos" */
const limitsLine = (spec) => {
  const exts = spec.ext.slice(0, 4).map((e) => e.toUpperCase()).join(', ');
  return `${exts}${spec.ext.length > 4 ? '…' : ''} · até ${formatBytes(spec.maxBytes)} cada · até ${spec.maxCount}`;
};

const Row = ({ item, onRemove, onRetry }) => (
  <li className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-inset ring-black/[0.06]">
    <div className="min-w-0 flex-1">
      {/* Nome ORIGINAL, com acento e espaço. O caminho no Storage é
          higienizado, mas o cliente precisa reconhecer o próprio arquivo. */}
      <p className="truncate text-[13px] font-medium text-neutral-900">{item.name}</p>
      <p className="text-[12px] text-neutral-400">
        {item.error
          ? <span className="text-red-600">{item.error}</span>
          : item.status === 'uploading'
            ? `enviando… ${Math.round((item.progress || 0) * 100)}%`
            : formatBytes(item.size)}
      </p>
      {item.status === 'uploading' && (
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-neutral-900/[0.08]">
          <div
            className="h-full rounded-full bg-neutral-900 transition-[width] duration-200"
            style={{ width: `${Math.round((item.progress || 0) * 100)}%` }}
          />
        </div>
      )}
    </div>
    {item.error && onRetry && (
      <button
        type="button"
        onClick={onRetry}
        aria-label="Tentar de novo"
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-900/[0.06] hover:text-neutral-900 ${focusRing}`}
      >
        <RotateCcw size={14} strokeWidth={2.1} />
      </button>
    )}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${item.name}`}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-900/[0.06] hover:text-neutral-900 ${focusRing}`}
      >
        <X size={14} strokeWidth={2.1} />
      </button>
    )}
  </li>
);

export const FileField = ({ field }) => {
  const spec = FIELDS[field];
  const { token, files, setFiles, readOnly } = useBrief();
  const [pending, setPending] = useState([]); // uploads em andamento ou com erro
  const [dragging, setDragging] = useState(false);
  const Icon = ICON[spec.layout] || Paperclip;

  const saved = files.filter((f) => f.field === field && f.status === 'ready');
  const total = saved.length + pending.filter((p) => p.status !== 'error').length;
  const full = total >= spec.maxCount;

  const update = useCallback((key, patch) => {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }, []);

  const start = useCallback((fileList) => {
    const chosen = Array.from(fileList || []);
    if (!chosen.length) return;

    const room = spec.maxCount - total;
    const accepted = chosen.slice(0, Math.max(0, room));

    const jobs = accepted.map((file) => {
      const key = `${file.name}-${file.size}-${Math.round(performance.now())}-${Math.random()}`;
      const local = precheck(field, file);
      setPending((prev) => [...prev, {
        key,
        name: file.name,
        size: file.size,
        status: local ? 'error' : 'uploading',
        error: local,
        progress: 0,
        file,
      }]);
      if (local) return null;

      return async () => {
        try {
          const created = await uploadFile({
            token,
            field,
            file,
            onProgress: (p) => update(key, { progress: p }),
          });
          // Entra na lista de salvos e sai da de pendentes: uma fonte só por
          // arquivo, senão ele apareceria duplicado por um instante.
          setFiles((prev) => [...prev, { ...created, field }]);
          setPending((prev) => prev.filter((p) => p.key !== key));
        } catch (err) {
          update(key, { status: 'error', error: err.message, fileId: err.fileId });
        }
      };
    }).filter(Boolean);

    runQueue(jobs, 3);
  }, [field, spec.maxCount, total, token, setFiles, update]);

  const retry = useCallback((item) => {
    update(item.key, { status: 'uploading', error: '', progress: 0 });
    uploadFile({
      token, field, file: item.file, fileId: item.fileId,
      onProgress: (p) => update(item.key, { progress: p }),
    })
      .then((created) => {
        setFiles((prev) => [...prev, { ...created, field }]);
        setPending((prev) => prev.filter((p) => p.key !== item.key));
      })
      .catch((err) => update(item.key, { status: 'error', error: err.message, fileId: err.fileId }));
  }, [token, field, setFiles, update]);

  const remove = useCallback(async (file) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    await fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', c: token, fileId: file.id }),
    }).catch(() => {});
  }, [token, setFiles]);

  // Miniatura só durante o envio: depois do reload o bucket é privado, e
  // assinar 20 URLs a cada carga da página custaria caro para pouco retorno.
  useEffect(() => () => {
    pending.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview); });
  }, [pending]);

  const accept = [...spec.mime, ...spec.ext.map((e) => `.${e}`)].join(',');

  return (
    <section>
      <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-900">{spec.question}</h2>
      <p className="mt-1.5 text-[13px] leading-[1.55] text-neutral-500">{spec.help}</p>
      <p className="mt-1 text-[12px] text-neutral-400">{limitsLine(spec)}</p>

      {!readOnly && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); start(e.dataTransfer.files); }}
          className={[
            'mt-3 rounded-2xl p-4 ring-1 ring-inset transition-colors duration-200',
            dragging ? 'bg-neutral-900/[0.06] ring-black/20' : 'bg-neutral-900/[0.035] ring-black/[0.05]',
            spec.layout === 'hero' ? 'py-7' : '',
          ].join(' ')}
        >
          {/* Input real por trás com rótulo clicável: no celular não existe
              arrastar, e um dropzone só de drag é campo morto em metade dos
              acessos. */}
          <input
            id={`file-${field}`}
            type="file"
            accept={accept}
            multiple={spec.maxCount > 1}
            disabled={full}
            onChange={(e) => { start(e.target.files); e.target.value = ''; }}
            className="sr-only"
          />
          <label
            htmlFor={`file-${field}`}
            className={`flex cursor-pointer flex-col items-center gap-2 text-center ${full ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-500 ring-1 ring-inset ring-black/[0.06]">
              <Icon size={18} strokeWidth={1.8} />
            </span>
            <span className="text-[13px] font-medium text-neutral-900">
              {full ? `Limite de ${spec.maxCount} atingido` : 'Escolher arquivo'}
            </span>
            <span className="text-[12px] text-neutral-400">ou arraste aqui</span>
          </label>
        </div>
      )}

      {(saved.length > 0 || pending.length > 0) && (
        <ul className="mt-3 flex flex-col gap-2">
          {saved.map((f) => (
            <Row
              key={f.id}
              item={{ name: f.originalName, size: f.sizeBytes, status: 'ready' }}
              onRemove={readOnly ? null : () => remove(f)}
            />
          ))}
          {pending.map((p) => (
            <Row
              key={p.key}
              item={p}
              onRetry={p.error && p.file ? () => retry(p) : null}
              onRemove={p.status === 'error' ? () => setPending((prev) => prev.filter((x) => x.key !== p.key)) : null}
            />
          ))}
        </ul>
      )}

      <WhatsAppEscape field={field} label={spec.label} />
    </section>
  );
};
