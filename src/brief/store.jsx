import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BriefContext } from './context.js';
import { readClientToken } from './token.js';

const AUTOSAVE_MS = 1200;

// A API já devolve camelCase para o brief; os arquivos vêm normalizados no
// mesmo formato. Manter a função mesmo assim documenta a fronteira: se o dia
// de trocar o formato chegar, muda aqui e em nenhum outro lugar.
const normalizeFile = (row) => ({
  id: row.id,
  field: row.field,
  originalName: row.originalName,
  contentType: row.contentType,
  sizeBytes: row.sizeBytes,
  status: row.status,
  createdAt: row.createdAt,
});

const EMPTY_BRIEF = {
  id: null,
  status: 'draft',
  brandName: '',
  instagram: '',
  description: '',
  designSystemUrl: '',
  notes: '',
  whatsappFields: [],
};

export const BriefProvider = ({ children }) => {
  const [token] = useState(readClientToken);
  const [status, setStatus] = useState(token ? 'loading' : 'invalid');
  const [brief, setBrief] = useState(EMPTY_BRIEF);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState('idle'); // idle | saving | saved | error

  // Campos alterados desde o último save. Um Set porque o cliente pode mexer
  // em três campos dentro da janela do debounce, e só o que mudou deve subir.
  const dirtyRef = useRef(new Set());
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const briefRef = useRef(brief);
  briefRef.current = brief;

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/brief?c=${encodeURIComponent(token)}`);
      if (res.status === 404) { setStatus('invalid'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBrief({ ...EMPTY_BRIEF, ...data.brief });
      setFiles((data.files || []).map(normalizeFile));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const flush = useCallback(async () => {
    if (!token || !dirtyRef.current.size) return;
    if (briefRef.current.status === 'submitted') { dirtyRef.current.clear(); return; }

    const patch = {};
    dirtyRef.current.forEach((name) => { patch[name] = briefRef.current[name]; });
    dirtyRef.current.clear();

    // Cancela o PATCH anterior ainda em voo. Sem isto, uma resposta lenta de
    // uma digitação antiga chega depois da nova e o indicador pisca "salvo"
    // para um estado que já mudou — e, pior, o retry poderia regravar o texto
    // antigo por cima do atual.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSaving('saving');
    try {
      const res = await fetch('/api/brief', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ c: token, patch }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaving('saved');
    } catch (err) {
      if (err.name === 'AbortError') return; // substituído por um save mais novo
      // Devolve os campos ao dirty set: a próxima tentativa leva tudo junto,
      // em vez de perder o que falhou.
      Object.keys(patch).forEach((name) => dirtyRef.current.add(name));
      setSaving('error');
    }
  }, [token]);

  const setField = useCallback((name, value) => {
    // Estado local na hora: digitação não pode esperar a rede.
    setBrief((prev) => ({ ...prev, [name]: value }));
    dirtyRef.current.add(name);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, AUTOSAVE_MS);
  }, [flush]);

  // beforeunload não é confiável — o browser mata a requisição no meio. O
  // gesto real de quem sai é trocar de aba ou bloquear o celular, e isso
  // dispara visibilitychange, que ainda dá tempo de gravar.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [flush]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const toggleWhatsapp = useCallback((field) => {
    const current = briefRef.current.whatsappFields || [];
    const next = current.includes(field)
      ? current.filter((f) => f !== field)
      : [...current, field];
    setField('whatsappFields', next);
  }, [setField]);

  const value = useMemo(() => ({
    token,
    status,
    brief,
    files,
    saving,
    setField,
    flush,
    toggleWhatsapp,
    setFiles,
    reload: load,
    readOnly: brief.status === 'submitted',
  }), [token, status, brief, files, saving, setField, flush, toggleWhatsapp, load]);

  return <BriefContext.Provider value={value}>{children}</BriefContext.Provider>;
};
