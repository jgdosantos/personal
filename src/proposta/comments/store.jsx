import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CommentsContext } from './context.js';

const IDENTITY_KEY = 'proposta:identity';
const OWNER_KEY = 'proposta:owner-token';
const POLL_MS = 20000;

const normalize = (row) => ({
  id: row.id,
  parentId: row.parent_id,
  anchorId: row.anchor_id,
  relX: row.rel_x,
  relY: row.rel_y,
  authorName: row.author_name,
  authorRole: row.author_role,
  body: row.body,
  createdAt: row.created_at,
});

// The owner link is /proposta-marcelo?owner=<token>. We stash it in
// sessionStorage so the token survives in-page navigation without living in
// the URL for the rest of the session.
const readOwnerToken = () => {
  if (typeof window === 'undefined') return '';
  const fromUrl = new URLSearchParams(window.location.search).get('owner');
  if (fromUrl) {
    try {
      window.sessionStorage.setItem(OWNER_KEY, fromUrl);
    } catch { /* private mode */ }
    return fromUrl;
  }
  try {
    return window.sessionStorage.getItem(OWNER_KEY) || '';
  } catch {
    return '';
  }
};

export const CommentsProvider = ({ slug, children }) => {
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [mode, setMode] = useState('browse'); // browse | comment
  const [draft, setDraft] = useState(null); // { anchorId, relX, relY }
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const ownerToken = useMemo(readOwnerToken, []);

  // Quem abriu com o token começa como dono; qualquer outra pessoa é visitante.
  // Com o token dá para alternar para visitante e testar como o cliente vê.
  const [identity, setIdentityState] = useState(() => {
    if (!ownerToken) return 'client';
    try {
      return window.localStorage.getItem(IDENTITY_KEY) === 'client' ? 'client' : 'owner';
    } catch {
      return 'owner';
    }
  });

  // Sem token não existe "owner": a escolha na tela decide apenas de qual lado
  // você fala, nunca se você tem direito a falar como dono.
  const setIdentity = useCallback((next) => {
    const value = next === 'owner' && ownerToken ? 'owner' : 'client';
    setIdentityState(value);
    try {
      window.localStorage.setItem(IDENTITY_KEY, value);
    } catch { /* private mode */ }
  }, [ownerToken]);

  const isOwner = Boolean(ownerToken) && identity === 'owner';

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setComments((data.comments || []).map(normalize));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [slug]);

  useEffect(() => {
    refresh();
    const tick = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  const post = useCallback(async (payload) => {
    setSending(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          // O token só viaja quando você escolheu falar como dono — é ele que
          // o servidor confere para carimbar o papel e rotear a notificação.
          ownerToken: isOwner ? ownerToken : '',
          ...payload,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const created = normalize(data.comment);
      setComments((prev) => [...prev, created]);
      return created;
    } finally {
      setSending(false);
    }
  }, [slug, ownerToken, isOwner]);

  const createThread = useCallback(async (body) => {
    if (!draft) return null;
    const created = await post({ ...draft, body });
    setDraft(null);
    setMode('browse');
    setActiveThreadId(created.id);
    setPanelOpen(true);
    return created;
  }, [draft, post]);

  const reply = useCallback((parentId, body) => post({ parentId, body }), [post]);

  // Threads são numeradas por ordem de criação — o número do pin é o mesmo
  // que aparece no painel lateral e no e-mail de notificação.
  const threads = useMemo(() => {
    const roots = comments
      .filter((c) => !c.parentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return roots.map((root, index) => ({
      ...root,
      number: index + 1,
      replies: comments
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }));
  }, [comments]);

  const value = useMemo(() => ({
    slug,
    threads,
    status,
    mode,
    setMode,
    draft,
    setDraft,
    activeThreadId,
    setActiveThreadId,
    panelOpen,
    setPanelOpen,
    identity,
    setIdentity,
    isOwner,
    canBeOwner: Boolean(ownerToken),
    sending,
    createThread,
    reply,
    refresh,
  }), [
    slug, threads, status, mode, draft, activeThreadId, panelOpen,
    identity, setIdentity, isOwner, ownerToken, sending, createThread, reply, refresh,
  ]);

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
};
