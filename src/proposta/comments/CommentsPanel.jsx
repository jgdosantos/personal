import React, { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, MessageSquare, X, Send, CornerDownRight } from 'lucide-react';
import { useComments } from './context.js';

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

/**
 * Seletor de quem está falando. Só aparece para quem abriu com o token: sem
 * ele não há escolha a fazer — a pessoa é visitante e ponto.
 */
const IdentityPicker = () => {
  const { identity, setIdentity, canBeOwner } = useComments();
  if (!canBeOwner) return null;

  return (
    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
      Comentar como
      <select
        value={identity}
        onChange={(e) => setIdentity(e.target.value)}
        className="rounded-full border border-black/20 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-black focus:border-black focus:outline-none"
      >
        <option value="client">Cliente</option>
        <option value="owner">João Gabriel</option>
      </select>
    </label>
  );
};

/** Composer compartilhado por thread nova e resposta. */
const Composer = ({ placeholder, submitLabel, onSubmit, autoFocus = false }) => {
  const { sending } = useComments();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const areaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && areaRef.current) areaRef.current.focus();
  }, [autoFocus]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!body.trim()) {
      setError('Escreve o comentário antes de enviar.');
      return;
    }
    try {
      await onSubmit(body.trim());
      setBody('');
    } catch (err) {
      setError(err.message || 'Não consegui enviar. Tenta de novo.');
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <IdentityPicker />
      <textarea
        ref={areaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        className="w-full resize-none border border-black/15 rounded-xl p-3 text-sm leading-relaxed text-black placeholder:text-gray-400 focus:border-black focus:outline-none"
      />
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="self-start inline-flex items-center gap-2 rounded-full border border-black px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-black transition-all duration-300 hover:bg-black hover:text-white disabled:opacity-40"
      >
        <Send size={13} />
        {sending ? 'Enviando…' : submitLabel}
      </button>
    </form>
  );
};

/**
 * Diz de que lado da conversa veio o comentário. O rótulo é relativo a quem
 * está lendo: o mesmo comentário do João aparece como "você" para ele e como
 * "autor da proposta" para o cliente.
 */
const RoleBadge = ({ role, viewerIsOwner }) => {
  const mine = (role === 'owner') === viewerIsOwner;
  const label = mine ? 'você' : role === 'owner' ? 'autor da proposta' : 'cliente';

  return (
    <span
      className={[
        'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]',
        role === 'owner'
          ? 'bg-black text-white'
          : 'border border-black/25 text-gray-500',
      ].join(' ')}
    >
      {label}
    </span>
  );
};

const StartButton = ({ onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-white hover:text-black ${className}`}
  >
    <MessageSquarePlus size={14} />
    Comentar num trecho
  </button>
);

const Thread = ({ thread }) => {
  const { activeThreadId, setActiveThreadId, reply, isOwner } = useComments();
  const isActive = thread.id === activeThreadId;

  return (
    <li className={`border-b border-black/10 px-6 py-5 transition-colors ${isActive ? 'bg-black/[0.03]' : ''}`}>
      <button
        type="button"
        onClick={() => setActiveThreadId(isActive ? null : thread.id)}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-black tabular-nums text-white">
          {thread.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-black">
              {thread.authorName}
            </span>
            <RoleBadge role={thread.authorRole} viewerIsOwner={isOwner} />
            <span className="text-[10px] uppercase tracking-widest text-gray-400">
              {timeAgo(thread.createdAt)}
            </span>
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-gray-700">{thread.body}</span>
        </span>
      </button>

      {thread.replies.length > 0 && (
        <ul className="mt-4 space-y-3 border-l border-black/15 pl-4 ml-3">
          {thread.replies.map((r) => (
            <li key={r.id}>
              <div className="flex flex-wrap items-center gap-2">
                <CornerDownRight size={12} className="text-gray-400" />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-black">
                  {r.authorName}
                </span>
                <RoleBadge role={r.authorRole} viewerIsOwner={isOwner} />
                <span className="text-[10px] uppercase tracking-widest text-gray-400">
                  {timeAgo(r.createdAt)}
                </span>
              </div>
              <p className="mt-1 pl-5 text-sm leading-relaxed text-gray-700">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      {isActive && (
        <div className="mt-5 ml-3 border-l border-black/15 pl-4">
          <Composer
            autoFocus
            placeholder="Responder…"
            submitLabel="Responder"
            onSubmit={(body) => reply(thread.id, body)}
          />
        </div>
      )}
    </li>
  );
};

export const CommentsPanel = () => {
  const {
    threads, status, mode, setMode, draft, setDraft,
    panelOpen, setPanelOpen, createThread, isOwner,
  } = useComments();

  const total = threads.reduce((sum, t) => sum + 1 + t.replies.length, 0);

  // Fecha o painel e entra em modo comentário. Sem isso o painel aberto vira um
  // beco sem saída: ele manda "toque em Comentar", mas a barra flutuante que
  // tem esse botão só existe enquanto o painel está fechado.
  const startCommenting = () => {
    setDraft(null);
    setMode('comment');
    setPanelOpen(false);
  };

  return (
    <>
      {/* Barra flutuante. Vive numa bandeja branca para não sumir nas seções
          pretas da proposta. */}
      {!panelOpen && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-1 rounded-full border border-black/10 bg-white/90 p-1 shadow-[0_6px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm print:hidden">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition-colors duration-300 hover:bg-black/[0.06]"
          >
            <MessageSquare size={14} />
            {total > 0 ? `${total}` : 'Comentários'}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = mode === 'comment' ? 'browse' : 'comment';
              setMode(next);
              setDraft(null);
            }}
            className={[
              'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300',
              mode === 'comment'
                ? 'border-black bg-white text-black hover:bg-black/[0.06]'
                : 'border-black bg-black text-white hover:bg-white hover:text-black',
            ].join(' ')}
          >
            {mode === 'comment' ? <X size={14} /> : <MessageSquarePlus size={14} />}
            {mode === 'comment' ? 'Cancelar' : 'Comentar'}
          </button>
        </div>
      )}

      {/* Faixa de instrução no modo comentário */}
      {mode === 'comment' && !draft && !panelOpen && (
        <div className="fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-black px-5 py-2.5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.25)] print:hidden">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            Clique num trecho <span className="text-gray-400">destacado</span> para comentar ali
          </p>
        </div>
      )}

      {/* Painel lateral */}
      <aside
        className={[
          'fixed right-0 top-0 z-[80] flex h-full w-full flex-col border-l-2 border-black bg-white transition-transform duration-300 sm:w-[420px] print:hidden',
          panelOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="flex items-center justify-between border-b-2 border-black px-6 py-5">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-black">
              Comentários
            </h2>
            {/* Sem isso dá para comentar a sessão inteira como visitante sem
                perceber que o link abriu sem o ?owner=. */}
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${isOwner ? 'bg-black' : 'border border-black/40'}`}
              />
              Comentando como
              <span className="text-black">
                {isOwner ? 'João Gabriel' : 'Cliente'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPanelOpen(false);
              setDraft(null);
              setMode('browse');
            }}
            aria-label="Fechar painel"
            className="rounded-full border border-black/20 p-2 text-black transition-colors hover:bg-black hover:text-white"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {draft && (
            <div className="border-b-2 border-black bg-black/[0.03] px-6 py-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Novo comentário neste trecho
              </p>
              <Composer
                autoFocus
                placeholder="O que você quer perguntar ou ajustar aqui?"
                submitLabel="Comentar"
                onSubmit={createThread}
              />
            </div>
          )}

          {status === 'error' && (
            <p className="px-6 py-8 text-sm text-gray-500">
              Não consegui carregar os comentários agora. Recarregue a página.
            </p>
          )}

          {status === 'ready' && threads.length === 0 && !draft && (
            <div className="px-6 py-10">
              <p className="text-sm leading-relaxed text-gray-500">
                Nenhum comentário ainda. Toque no botão abaixo e depois clique no trecho da
                proposta sobre o qual você quer falar — o comentário fica ancorado ali.
              </p>
              <StartButton onClick={startCommenting} className="mt-6" />
            </div>
          )}

          <ul>
            {threads.map((thread) => (
              <Thread key={thread.id} thread={thread} />
            ))}
          </ul>

          {status === 'ready' && threads.length > 0 && !draft && (
            <div className="px-6 py-8">
              <StartButton onClick={startCommenting} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
