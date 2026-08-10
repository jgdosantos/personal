import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// BOAS-VINDAS — só na primeira visita
// ============================================
// A tela cobre a proposta por ~3s, apresenta o projeto e ensina a única
// funcionalidade não óbvia da página: comentar num trecho. Depois some e
// nunca mais aparece — a marca fica no localStorage.

const STORAGE_KEY = 'proposta:welcomed';

// Tempo até o auto-dismiss, contado do mount. A entrada escalonada termina
// em ~1.1s, o que deixa ~1.8s de leitura antes da saída começar.
const AUTO_DISMISS_MS = 2900;
const EXIT_MS = 500;
// Sem movimento não há entrada para assistir: mostra pronto e sai antes.
const REDUCED_DISMISS_MS = 1600;

// Fallback para navegador com storage bloqueado: pelo menos não repete a
// boas-vindas a cada remontagem dentro do mesmo carregamento.
let dismissedThisLoad = false;

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Decide se a tela aparece. Roda no inicializador do useState, ou seja,
 * antes da primeira pintura — em visita repetida o overlay nunca chega a
 * ser montado e não existe flash.
 */
const shouldShow = () => {
  if (typeof window === 'undefined') return false;
  if (dismissedThisLoad) return false;

  // Atalho de teste: ?welcome=1 força a tela mesmo com a marca gravada.
  try {
    if (new URLSearchParams(window.location.search).get('welcome') === '1') return true;
  } catch {
    /* querystring inválida — segue para a checagem normal */
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    // Storage indisponível (modo privado, cookies bloqueados): mostra uma
    // vez por carregamento em vez de sumir de vez com a apresentação.
    return true;
  }
};

const markAsSeen = () => {
  dismissedThisLoad = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* sem storage, dismissedThisLoad já segura o resto da sessão */
  }
};

// Entrada escalonada em style inline: com `reduced` o objeto some inteiro,
// então não sobra transição nem estado inicial invisível para animar.
const reveal = (shown, reduced, delay) =>
  reduced
    ? undefined
    : {
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(14px)',
        transitionProperty: 'opacity, transform',
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
      };

const WelcomeOverlay = ({ onDone }) => {
  const [reduced] = useState(prefersReducedMotion);
  // Sem movimento a tela já nasce no estado final — nada a interpolar.
  const [shown, setShown] = useState(reduced);
  const [leaving, setLeaving] = useState(false);
  const closedRef = useRef(false);
  const buttonRef = useRef(null);

  const dismiss = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    markAsSeen();
    setLeaving(true);
  }, []);

  // Dispara a entrada no frame seguinte para que o browser registre o
  // estado inicial e tenha o que interpolar.
  useEffect(() => {
    if (reduced) return undefined;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [reduced]);

  // Auto-dismiss.
  useEffect(() => {
    const id = setTimeout(dismiss, reduced ? REDUCED_DISMISS_MS : AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [dismiss, reduced]);

  // Esc: saída sempre disponível pelo teclado.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dismiss]);

  // Desmonta depois da saída. Com `reduced` o overlay sai no mesmo tick.
  useEffect(() => {
    if (!leaving) return undefined;
    const id = setTimeout(onDone, reduced ? 0 : EXIT_MS);
    return () => clearTimeout(id);
  }, [leaving, onDone, reduced]);

  // Trava o scroll enquanto a tela está no ar. A compensação da barra de
  // rolagem evita o pulo horizontal, e o cleanup devolve os valores
  // originais aconteça o que acontecer com o desmonte.
  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, []);

  // Foco no botão: leitor de tela anuncia a saída e Enter já funciona.
  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={dismiss}
      className={[
        'fixed inset-0 z-[100] flex items-center overflow-hidden bg-black print:hidden',
        reduced ? '' : 'transition-opacity duration-500 ease-out',
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100',
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-right leading-none"
      >
        <span className="block text-[30vw] font-black tracking-tighter text-white opacity-[0.04]">
          JG
        </span>
      </div>

      <div
        className={[
          'relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8',
          reduced ? '' : 'transition-transform duration-500 ease-out',
          leaving && !reduced ? '-translate-y-3' : 'translate-y-0',
        ].join(' ')}
      >
        <span
          style={reveal(shown, reduced, 0)}
          className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 md:text-sm"
        >
          Proposta · Site institucional
        </span>

        <h2
          id="welcome-title"
          style={{
            fontSize: 'clamp(2.25rem, 6vw, 84px)',
            marginLeft: '-0.04em',
            ...reveal(shown, reduced, 90),
          }}
          className="mt-5 font-medium leading-[0.95] tracking-tighter text-white"
        >
          Bem-vindo, Marcelo.
        </h2>

        <div
          style={reveal(shown, reduced, 180)}
          className="mt-8 h-px w-full max-w-[52ch] bg-white/15 md:mt-10"
        />

        <p
          style={reveal(shown, reduced, 240)}
          className="mt-8 max-w-[52ch] text-lg leading-[1.6] text-gray-300 md:mt-10 md:text-xl"
        >
          Preparei esta proposta para o site da clínica da sua esposa. Escopo, prazo e
          investimento estão todos aqui, abertos.
        </p>

        <p
          style={reveal(shown, reduced, 320)}
          className="mt-4 max-w-[52ch] text-base leading-[1.6] text-gray-500"
        >
          Se algo não fizer sentido, comente direto no trecho: toque em Comentar, marque o
          ponto e eu respondo ali mesmo.
        </p>

        <div
          style={reveal(shown, reduced, 400)}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 md:mt-12"
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={dismiss}
            className="inline-flex items-center gap-2.5 rounded-full border border-white bg-white px-8 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-300 hover:bg-transparent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Ver a proposta
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </button>
          {/* No celular não existe Esc, e "clique" soa errado. */}
          <span className="text-xs uppercase tracking-[0.18em] text-gray-600">
            <span className="md:hidden">Toque em qualquer lugar para entrar</span>
            <span className="hidden md:inline">Clique em qualquer lugar ou pressione Esc</span>
          </span>
        </div>
      </div>

      {/* Barra de tempo: mostra que a tela sai sozinha, sem exigir ação. */}
      {!reduced && (
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-white/10">
          <div
            className="h-full origin-left bg-white/45"
            style={{
              transform: `scaleX(${shown ? 1 : 0})`,
              transitionProperty: 'transform',
              transitionDuration: `${AUTO_DISMISS_MS}ms`,
              transitionTimingFunction: 'linear',
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Portão da tela de boas-vindas. Mantém o overlay num componente separado
 * para que os efeitos (trava de scroll, timers, Esc) só existam enquanto
 * ela está no ar — em visita repetida nada disso chega a rodar.
 */
export const Welcome = () => {
  const [open, setOpen] = useState(shouldShow);
  const close = useCallback(() => setOpen(false), []);

  if (!open) return null;
  return <WelcomeOverlay onDone={close} />;
};

export default Welcome;
