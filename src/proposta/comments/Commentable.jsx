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
      'h-7 w-7 rounded-full border-2 text-[11px] font-black tabular-nums',
      'transition-transform duration-200 hover:scale-110',
      draft
        ? 'bg-white text-black border-black border-dashed animate-pulse'
        : active
          ? 'bg-white text-black border-black shadow-[0_0_0_4px_rgba(0,0,0,0.12)]'
          : 'bg-black text-white border-white shadow-[0_2px_10px_rgba(0,0,0,0.25)]',
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
  const pins = threads.filter((t) => t.anchorId === id);
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
        commenting ? 'cursor-crosshair rounded-lg outline-dashed outline-2 outline-offset-4 outline-black/40 hover:outline-black hover:bg-black/[0.04]' : '',
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
