import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// BOAS-VINDAS — só na primeira visita
// ============================================
// A tela apresenta o projeto e ensina a única funcionalidade não óbvia da
// página: comentar ancorado num trecho. Fica até a pessoa entrar, e depois
// nunca mais aparece — a marca fica no localStorage.

const STORAGE_KEY = 'proposta:welcomed';

// A tela NÃO sai sozinha. Ela explica como comentar na proposta, e um passo a
// passo que some antes de a pessoa terminar de ler não serve para nada — as
// duas versões cronometradas (2.9s e depois 6.5s) erraram por isso. Sai no
// clique do botão ou no Esc.
//
// Pelo mesmo motivo o clique no fundo não fecha: encostar fora do texto e
// perder a instrução seria fácil demais.
const EXIT_MS = 700;

// Fallback para navegador com storage bloqueado: pelo menos não repete a
// boas-vindas a cada remontagem dentro do mesmo carregamento.
let dismissedThisLoad = false;

// O passo a passo existe porque comentar ancorado não é um gesto que as
// pessoas conhecem: sem explicar, a proposta vira um PDF que se rola. Cada
// passo diz uma coisa só, na ordem em que ela acontece.
const STEPS = [
  {
    n: '01',
    title: 'Comente em qualquer trecho',
    text: 'Toque em Comentar e clique no ponto da proposta sobre o qual você quer falar. O comentário fica preso ali.',
  },
  {
    n: '02',
    title: 'Tire dúvidas e peça ajustes',
    text: 'Escopo, prazo, valor, uma referência que você viu — escreva no próprio item, em vez de solto no WhatsApp.',
  },
  {
    n: '03',
    title: 'Eu respondo no mesmo lugar',
    text: 'Você recebe um e-mail quando eu responder, e marca como resolvido o que já estiver acertado.',
  },
];

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
        transform: shown ? 'translateY(0)' : 'translateY(18px)',
        transitionProperty: 'opacity, transform',
        transitionDuration: '1100ms',
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
      className={[
        // overflow-y-auto: com o passo a passo o conteúdo passa da altura da
        // tela em celular deitado, e cortar instrução seria pior que rolar.
        'fixed inset-0 z-[100] flex items-center overflow-y-auto bg-black py-12 print:hidden',
        reduced ? '' : 'transition-opacity duration-700 ease-out',
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
          reduced ? '' : 'transition-transform duration-700 ease-out',
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
            ...reveal(shown, reduced, 200),
          }}
          className="mt-5 font-medium leading-[0.95] tracking-tighter text-white"
        >
          Bem-vindo, Marcelo.
        </h2>

        <div
          style={reveal(shown, reduced, 420)}
          className="mt-8 h-px w-full max-w-[52ch] bg-white/15 md:mt-10"
        />

        <p
          style={reveal(shown, reduced, 560)}
          className="mt-8 max-w-[52ch] text-lg leading-[1.6] text-gray-300 md:mt-10 md:text-xl"
        >
          Preparei esta proposta para o site da clínica da sua esposa. Escopo, prazo e
          investimento estão todos aqui, abertos.
        </p>

        <ol
          style={reveal(shown, reduced, 760)}
          className="mt-10 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-7 border-t border-white/10 pt-8 sm:grid-cols-3 md:mt-12"
        >
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-600">
                {step.n}
              </span>
              <h3 className="mt-2.5 text-base font-semibold tracking-tight text-white">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-[1.6] text-gray-500">{step.text}</p>
            </li>
          ))}
        </ol>

        <div
          style={reveal(shown, reduced, 960)}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 md:mt-12"
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={dismiss}
            className="inline-flex items-center gap-2.5 rounded-full border border-white bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-300 hover:bg-transparent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Clique para acessar a proposta
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
        </div>
      </div>

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
