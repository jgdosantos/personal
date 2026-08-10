import React, { useCallback } from 'react';
import { useComments } from './context.js';

const Pin = ({ label, active, draft, relX, relY, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    style={{ left: `${relX * 100}%`, top: `${relY * 100}%` }}
    className={[
      'absolute z-30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center',
      'h-7 w-7 rounded-full border text-[11px] font-semibold tabular-nums',
      // Alvo de toque de 43px sem inchar o marcador: a área cresce, o círculo não.
      'after:absolute after:-inset-2 after:content-[""]',
      'transition-[transform,box-shadow,background-color] duration-200 ease-out hover:scale-110 active:scale-95',
      'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
      draft
        ? 'border-dashed border-neutral-900/45 bg-white text-neutral-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] animate-pulse'
        : active
          ? 'border-neutral-900/80 bg-white text-neutral-900 shadow-[0_0_0_5px_rgba(0,0,0,0.07),0_2px_8px_-2px_rgba(0,0,0,0.25)]'
          : 'border-white/70 bg-neutral-900 text-white shadow-[0_2px_8px_-1px_rgba(0,0,0,0.3)]',
    ].join(' ')}
  >
    {label}
  </button>
);

/**
 * Envolve um bloco da proposta e ancora os pins de comentário nele.
 * A posição do pin é gravada como fração da caixa do bloco, então o
 * marcador acompanha o layout em qualquer largura de tela.
 */
export const Commentable = ({ id, children, className = '' }) => {
  const {
    threads, mode, draft, setDraft,
    activeThreadId, setActiveThreadId, setPanelOpen,
  } = useComments();

  const commenting = mode === 'comment';
  // Thread resolvida perde o pin: a página vai ficando limpa conforme a revisão
  // avança, e a conversa continua no painel, atrás do expansor "resolvidos".
  const pins = threads.filter((t) => t.anchorId === id && !t.resolvedAt);
  const localDraft = draft && draft.anchorId === id ? draft : null;

  const handleClick = useCallback((event) => {
    if (!commenting) return;
    // Em modo comentário o clique marca a página — links e âncoras ficam inertes.
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setDraft({
      anchorId: id,
      relX: Math.min(0.98, Math.max(0.02, (event.clientX - rect.left) / rect.width)),
      relY: Math.min(0.98, Math.max(0.02, (event.clientY - rect.top) / rect.height)),
    });
    setPanelOpen(true);
    setActiveThreadId(null);
  }, [commenting, id, setDraft, setPanelOpen, setActiveThreadId]);

  const openThread = (threadId) => (event) => {
    event.stopPropagation();
    setActiveThreadId(threadId);
    setPanelOpen(true);
  };

  return (
    <div
      onClickCapture={handleClick}
      className={[
        'relative',
        // Em modo comentário o contorno precisa ser óbvio: é ele que diz quais
        // trechos aceitam clique. Sutil demais e o usuário clica no vazio.
        commenting
          ? 'cursor-crosshair rounded-2xl outline-dashed outline-[1.5px] outline-offset-[6px] outline-neutral-900/20 transition-[outline-color,background-color] duration-200 ease-out hover:bg-neutral-900/[0.025] hover:outline-neutral-900/55'
          : '',
        className,
      ].join(' ')}
    >
      {children}
      {pins.map((thread) => (
        <Pin
          key={thread.id}
          label={thread.number}
          relX={thread.relX}
          relY={thread.relY}
          active={thread.id === activeThreadId}
          onClick={openThread(thread.id)}
          title={`Comentário ${thread.number} — ${thread.authorName}`}
        />
      ))}
      {localDraft && (
        <Pin
          draft
          label="+"
          relX={localDraft.relX}
          relY={localDraft.relY}
          onClick={(e) => e.stopPropagation()}
          title="Novo comentário"
        />
      )}
    </div>
  );
};
