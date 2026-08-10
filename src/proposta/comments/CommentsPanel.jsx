import React, { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, MessageSquare, X, Send, Check } from 'lucide-react';
import { useComments } from './context.js';

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// Anel de foco único para todo o painel: discreto no repouso, inequívoco no
// teclado. Fica num const para não divergir entre botões.
const focusRing =
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/**
 * Seletor de quem está falando. Só aparece para quem abriu com o token: sem
 * ele não há escolha a fazer — a pessoa é visitante e ponto.
 */
const IdentityPicker = () => {
  const { identity, setIdentity, canBeOwner } = useComments();
  if (!canBeOwner) return null;

  return (
    <label className="flex items-center gap-2.5 text-[12px] text-neutral-500">
      Comentar como
      <select
        value={identity}
        onChange={(e) => setIdentity(e.target.value)}
        className={`h-10 rounded-xl border border-black/[0.07] bg-neutral-100/70 px-3 text-[13px] font-medium text-neutral-900 transition-colors duration-200 hover:bg-neutral-100 ${focusRing}`}
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
      <textarea
        ref={areaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        className={`w-full resize-none rounded-2xl border border-black/[0.07] bg-neutral-100/60 px-3.5 py-3 text-[14px] leading-[1.55] text-neutral-900 placeholder:text-neutral-400 transition-colors duration-200 focus:border-black/10 focus:bg-white ${focusRing}`}
      />
      {error && <p className="px-1 text-[12.5px] font-medium text-red-600" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className={`inline-flex h-10 items-center gap-2 self-start rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] transition-all duration-200 ease-out hover:bg-neutral-700 active:scale-[0.97] disabled:opacity-35 disabled:hover:bg-neutral-900 ${focusRing}`}
      >
        <Send size={14} strokeWidth={1.9} />
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
        'rounded-full px-2 py-[3px] text-[11px] font-medium leading-none',
        role === 'owner'
          ? 'bg-neutral-900 text-white'
          : 'bg-neutral-900/[0.06] text-neutral-500',
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
    className={`inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.16),0_8px_24px_-12px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out hover:bg-neutral-700 active:scale-[0.97] ${focusRing} ${className}`}
  >
    <MessageSquarePlus size={15} strokeWidth={1.9} />
    Comentar num trecho
  </button>
);

/**
 * Marca a thread como resolvida. Fica fora do <button> que abre a thread —
 * botão dentro de botão é HTML inválido e o clique vira loteria.
 */
const ResolveCheck = ({ resolved, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    role="checkbox"
    aria-checked={resolved}
    aria-label={resolved ? 'Reabrir comentário' : 'Marcar como resolvido'}
    title={resolved ? 'Reabrir' : 'Marcar como resolvido'}
    className={[
      'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200',
      focusRing,
      resolved
        ? 'border-transparent bg-neutral-900 text-white'
        : 'border-neutral-300 text-transparent hover:border-neutral-900 hover:text-neutral-300',
    ].join(' ')}
  >
    <Check size={13} strokeWidth={2.6} />
  </button>
);

const Thread = ({ thread }) => {
  const { activeThreadId, setActiveThreadId, reply, isOwner, toggleResolved } = useComments();
  const isActive = thread.id === activeThreadId;
  const resolved = Boolean(thread.resolvedAt);

  return (
    <li
      className={[
        'mx-3 flex gap-3 rounded-2xl px-4 py-3.5 transition-colors duration-200',
        isActive ? 'bg-neutral-900/[0.045]' : 'hover:bg-neutral-900/[0.025]',
        resolved ? 'opacity-55' : '',
      ].join(' ')}
    >
      <ResolveCheck resolved={resolved} onToggle={() => toggleResolved(thread.id, !resolved)} />

      <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setActiveThreadId(isActive ? null : thread.id)}
        className={`flex w-full items-start gap-3 rounded-xl text-left ${focusRing}`}
      >
        <span
          className={[
            'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
            resolved ? 'bg-neutral-300 text-white' : 'bg-neutral-900 text-white',
          ].join(' ')}
        >
          {thread.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-neutral-900">
              {thread.authorName}
            </span>
            <RoleBadge role={thread.authorRole} viewerIsOwner={isOwner} />
            <span className="text-[12px] text-neutral-400">
              {timeAgo(thread.createdAt)}
            </span>
          </span>
          <span className="mt-1 block text-[14px] leading-[1.55] text-neutral-600">{thread.body}</span>
        </span>
      </button>

      {thread.replies.length > 0 && (
        <ul className="mt-3 ml-9 space-y-2">
          {thread.replies.map((r) => (
            <li key={r.id} className="rounded-2xl rounded-tl-md bg-neutral-900/[0.045] px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[12.5px] font-semibold tracking-[-0.01em] text-neutral-900">
                  {r.authorName}
                </span>
                <RoleBadge role={r.authorRole} viewerIsOwner={isOwner} />
                <span className="text-[12px] text-neutral-400">
                  {timeAgo(r.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-[14px] leading-[1.55] text-neutral-600">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      {isActive && (
        <div className="mt-4 ml-9">
          <Composer
            autoFocus
            placeholder="Responder…"
            submitLabel="Responder"
            onSubmit={(body) => reply(thread.id, body)}
          />
        </div>
      )}
      </div>
    </li>
  );
};

export const CommentsPanel = () => {
  const {
    threads, status, mode, setMode, draft, setDraft,
    panelOpen, setPanelOpen, createThread, canBeOwner,
  } = useComments();

  // O contador mostra o que falta tratar, não o volume da conversa: uma
  // proposta toda resolvida deve marcar zero, não "12 comentários".
  const open = threads.filter((t) => !t.resolvedAt).length;

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
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-1 rounded-full border border-black/[0.06] bg-white/75 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_12px_32px_-8px_rgba(0,0,0,0.24)] backdrop-blur-xl print:hidden">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium tabular-nums text-neutral-700 transition-colors duration-200 hover:bg-neutral-900/[0.06] ${focusRing}`}
          >
            <MessageSquare size={15} strokeWidth={1.9} />
            {open > 0 ? `${open}` : 'Comentários'}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = mode === 'comment' ? 'browse' : 'comment';
              setMode(next);
              setDraft(null);
            }}
            className={[
              'inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-all duration-200 ease-out active:scale-[0.97]',
              mode === 'comment'
                ? 'bg-neutral-900/[0.06] text-neutral-700 hover:bg-neutral-900/[0.1]'
                : 'bg-neutral-900 text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] hover:bg-neutral-700',
              focusRing,
            ].join(' ')}
          >
            {mode === 'comment' ? <X size={15} strokeWidth={1.9} /> : <MessageSquarePlus size={15} strokeWidth={1.9} />}
            {mode === 'comment' ? 'Cancelar' : 'Comentar'}
          </button>
        </div>
      )}

      {/* Faixa de instrução no modo comentário */}
      {mode === 'comment' && !draft && !panelOpen && (
        <div className="fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-neutral-900/90 px-4 py-2.5 text-center shadow-[0_8px_28px_-8px_rgba(0,0,0,0.45)] backdrop-blur-xl print:hidden">
          <p className="text-[13px] font-medium tracking-[-0.005em] text-white">
            Clique num trecho <span className="text-white/55">destacado</span> para comentar ali
          </p>
        </div>
      )}

      {/* Painel lateral */}
      <aside
        className={[
          'fixed right-0 top-0 z-[80] flex h-full w-full flex-col overflow-hidden border-l border-black/[0.07] bg-white/85 backdrop-blur-2xl',
          'transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
          'sm:w-[420px] sm:rounded-l-3xl print:hidden',
          panelOpen
            ? 'translate-x-0 shadow-[-32px_0_64px_-32px_rgba(0,0,0,0.28)]'
            : 'translate-x-full shadow-none',
        ].join(' ')}
      >
        <header className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-900">
              Comentários
            </h2>
            {/* O seletor mora aqui, e não dentro do composer, para estar sempre
                alcançável: no composer só aparecia depois de abrir um rascunho,
                então trocar de lado exigia começar um comentário antes.
                Para quem não tem o token não há escolha — só o indicador, que
                evita comentar a sessão inteira como cliente sem perceber que o
                link abriu sem o ?owner=. */}
            {canBeOwner ? (
              <div className="mt-1.5">
                <IdentityPicker />
              </div>
            ) : (
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-neutral-400">
                <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full border border-neutral-300" />
                Comentando como
                <span className="font-medium text-neutral-600">Cliente</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setPanelOpen(false);
              setDraft(null);
              setMode('browse');
            }}
            aria-label="Fechar painel"
            className={`-mr-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors duration-200 hover:bg-neutral-900/[0.06] hover:text-neutral-900 ${focusRing}`}
          >
            <X size={17} strokeWidth={1.9} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain py-2">
          {draft && (
            <div className="mx-3 mb-2 rounded-2xl bg-neutral-900/[0.035] p-4 ring-1 ring-inset ring-black/[0.05]">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
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
            <p className="px-7 py-8 text-[14px] leading-[1.55] text-neutral-500">
              Não consegui carregar os comentários agora. Recarregue a página.
            </p>
          )}

          {status === 'ready' && threads.length === 0 && !draft && (
            <div className="px-7 py-10">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900/[0.05] text-neutral-400">
                <MessageSquare size={19} strokeWidth={1.7} />
              </span>
              <p className="text-[14px] leading-[1.6] text-neutral-500">
                Nenhum comentário ainda. Toque no botão abaixo e depois clique no trecho da
                proposta sobre o qual você quer falar — o comentário fica ancorado ali.
              </p>
              <StartButton onClick={startCommenting} className="mt-6" />
            </div>
          )}

          <ul className="space-y-0.5">
            {threads.map((thread) => (
              <Thread key={thread.id} thread={thread} />
            ))}
          </ul>

          {status === 'ready' && threads.length > 0 && !draft && (
            <div className="mt-2 border-t border-black/[0.06] px-7 py-6">
              <StartButton onClick={startCommenting} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
