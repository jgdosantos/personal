import React, { useEffect } from 'react';
import { AnimatedSection } from '../lib/animation.jsx';
import { CommentsProvider } from './comments/store.jsx';
import { CommentsPanel } from './comments/CommentsPanel.jsx';
import { Commentable } from './comments/Commentable.jsx';
import { Welcome } from './Welcome.jsx';
import {
  PROPOSAL_SLUG, PDF_PATH, meta, scope, steps, maintenanceItems, info, whatsappLink,
} from './content.js';

const APPROVE_LINK = whatsappLink(
  'Olá João! Vi a proposta do site institucional e quero aprovar. Podemos começar?'
);
const TALK_LINK = whatsappLink(
  'Olá João! Vi a proposta do site institucional e tenho algumas dúvidas.'
);

// Uma medida só para o corpo de texto. Parágrafo em `max-w-2xl` na largura
// cheia passava de 90 caracteres por linha, o que cansa a leitura; medidas em
// `ch` amarram o limite ao tamanho real da fonte, não ao viewport.
const LEAD = 'max-w-[52ch]';
const BODY = 'max-w-[46ch]';

// Âncora de rolagem: o header é fixo, então sem `scroll-mt` o topo de cada
// seção parava atrás dele ao clicar no menu.
const SECTION = 'scroll-mt-24 md:scroll-mt-28';

// Contêiner único. Antes o hero usava max-w-7xl e o resto max-w-6xl, o que
// desalinhava a margem esquerda em telas largas.
const SHELL = 'mx-auto w-full max-w-6xl px-6 md:px-8';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white';
const focusRingDark =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black';

const Kicker = ({ children, className = '' }) => (
  <span className={`block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 md:text-sm ${className}`}>
    {children}
  </span>
);

const SectionTitle = ({ children }) => (
  // 6xl só a partir de lg: em 768px um título black de 60px ao lado do preço
  // quebrava em quatro linhas dentro do contêiner.
  <h2 className="text-balance text-4xl font-black uppercase leading-[0.92] tracking-tighter text-black md:text-5xl lg:text-6xl">
    {children}
  </h2>
);

const PillLink = ({ href, children, dark = false }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={
      dark
        ? `inline-block rounded-full border border-white bg-white px-7 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-300 hover:bg-transparent hover:text-white md:px-8 ${focusRingDark}`
        : `inline-block rounded-full border border-black px-7 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-300 hover:bg-black hover:text-white md:px-8 ${focusRing}`
    }
  >
    {children}
  </a>
);

const NAV = [
  ['#escopo', 'Escopo'],
  ['#processo', 'Processo'],
  ['#manutencao', 'Manutenção'],
  ['#info', 'Informações'],
];

const PropostaMarcelo = () => {
  useEffect(() => {
    document.title = 'Proposta · Site Institucional · João Gabriel';
  }, []);

  return (
    <CommentsProvider slug={PROPOSAL_SLUG}>
      {/* `proposta-page` reativa as utilidades de tipografia do Tailwind
          dentro desta página — ver a nota no src/index.css. */}
      <div className="proposta-page min-h-screen bg-white">
        <Welcome />

        {/* ============ HEADER ============ */}
        <header className="fixed top-0 left-0 z-50 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-sm print:hidden">
          <div className={`${SHELL} flex items-center justify-between gap-4 py-4 md:py-5`}>
            <a
              href="/"
              className={`flex-shrink-0 rounded-sm text-sm font-black uppercase tracking-tighter text-black ${focusRing}`}
            >
              João Gabriel
            </a>
            <nav className="hidden gap-8 md:flex">
              {NAV.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className={`rounded-sm text-sm font-medium uppercase tracking-wider text-gray-500 transition-colors hover:text-black ${focusRing}`}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="flex flex-shrink-0 items-center gap-2">
              {/* No cabeçalho o rótulo encurta para "PDF" abaixo de md: em
                  375px "Baixar PDF" + "Aprovar proposta" não cabem lado a
                  lado, e o ícone já carrega o significado. */}
              <a
                href={PDF_PATH}
                download
                className={`inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black transition-colors duration-300 hover:border-black hover:bg-black hover:text-white md:px-4 md:text-xs ${focusRing}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="md:hidden">PDF</span>
                <span className="hidden md:inline">Baixar PDF</span>
              </a>
              <a
                href={APPROVE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-full border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-white hover:text-black md:px-5 md:text-xs ${focusRing}`}
              >
                Aprovar proposta
              </a>
            </div>
          </div>
        </header>

        {/* ============ HERO ============ */}
        {/* Sem AnimatedSection aqui: o wrapper começa em opacity 0 e só
            aparece depois que o IntersectionObserver dispara, o que atrasa o
            LCP justamente no elemento maior da página. Acima da dobra não há
            scroll para animar. */}
        <section className="relative flex min-h-screen items-center overflow-hidden bg-white pt-32 pb-24 md:pt-36">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 z-0 -translate-y-1/2 select-none overflow-hidden text-right leading-none"
          >
            <span className="block text-[30vw] font-black tracking-tighter text-black opacity-[0.05]">
              JG
            </span>
          </div>

          <div className={`relative z-20 ${SHELL}`}>
            <Commentable id="hero">
              <Kicker>{meta.kicker}</Kicker>
              <h1
                className="mt-6 text-balance font-medium leading-[0.9] tracking-tighter text-black"
                style={{ fontSize: 'clamp(2.375rem, 6.6vw, 108px)', marginLeft: '-0.045em' }}
              >
                Um site que trabalha{' '}
                <span className="text-gray-400">pelo seu negócio,</span>{' '}
                24 horas por dia.
              </h1>
              <p className={`mt-8 ${LEAD} text-pretty text-lg leading-[1.6] text-gray-600 md:mt-10 md:text-xl`}>
                Presença digital feita para transformar visita em agendamento: design
                exclusivo, carregamento rápido e uma base pronta para crescer junto com a
                clínica.
              </p>
            </Commentable>

            <div className="mt-16 md:mt-20">
              <Commentable id="hero-meta">
                <dl className="grid grid-cols-1 gap-8 border-t-2 border-black pt-8 sm:grid-cols-3 md:gap-12">
                  {[
                    ['Formato', meta.title],
                    ['Entrega', meta.delivery],
                    ['Investimento', meta.price],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        {label}
                      </dt>
                      <dd className="text-xl font-black leading-tight tracking-tighter text-black md:text-2xl">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Commentable>
            </div>
          </div>
        </section>

        {/* ============ ESCOPO ============ */}
        <section id="escopo" className={`${SECTION} bg-white py-24 md:py-32`}>
          <div className={SHELL}>
            <Commentable id="escopo-intro">
              <AnimatedSection>
                <div className="flex flex-col gap-10 border-b-2 border-black pb-10 md:pb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
                  <div>
                    <Kicker className="mb-5">O que está incluso</Kicker>
                    <SectionTitle>
                      Escopo completo,<br className="hidden md:block" /> sem letras miúdas.
                    </SectionTitle>
                    <p className={`mt-6 ${LEAD} text-pretty text-lg leading-[1.6] text-gray-600`}>
                      Os dez itens abaixo entram no valor apresentado. O que estiver fora da
                      lista é orçado à parte e só entra com a sua aprovação.
                    </p>
                  </div>
                  <div className="flex-shrink-0 lg:pb-1 lg:text-right">
                    <Kicker className="mb-2">A partir de</Kicker>
                    <p className="text-5xl font-black leading-none tracking-tighter text-black lg:text-6xl">
                      R$&nbsp;2.000
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </Commentable>

            <div className="mt-4 grid grid-cols-1 gap-x-12 gap-y-0 md:mt-6 md:grid-cols-2 lg:gap-x-20">
              {scope.map((item) => (
                <Commentable key={item.anchor} id={item.anchor}>
                  <AnimatedSection>
                    <div className="flex gap-5 border-b border-black/10 py-7 md:py-8">
                      <span className="mt-[0.35rem] text-xs font-bold tabular-nums tracking-widest text-gray-400">
                        {item.n}
                      </span>
                      <div className="min-w-0">
                        <h3 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-black leading-tight tracking-tight text-black md:text-xl">
                          {item.title}
                          {item.badge && (
                            <span className="rounded-full border border-black/[0.08] bg-black/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.15em] text-gray-600">
                              {item.badge}
                            </span>
                          )}
                        </h3>
                        <p className={`mt-2.5 ${BODY} text-pretty text-[15px] leading-relaxed text-gray-600 md:text-base`}>
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                </Commentable>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PROCESSO ============ */}
        <section id="processo" className={`${SECTION} bg-white py-24 md:py-32`}>
          <div className={SHELL}>
            <Commentable id="processo-intro">
              <AnimatedSection>
                <Kicker className="mb-5">O processo</Kicker>
                <SectionTitle>Como o projeto acontece.</SectionTitle>
                <p className={`mt-6 ${LEAD} text-pretty text-lg leading-[1.6] text-gray-600`}>
                  Do briefing à publicação, quatro etapas. Em cada uma você sabe o que está
                  sendo feito e o que vem depois.
                </p>
              </AnimatedSection>
            </Commentable>

            <div className="mt-12 grid grid-cols-1 border-t-2 border-black sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
              {steps.map((step, index) => (
                <Commentable
                  key={step.anchor}
                  id={step.anchor}
                  className={[
                    'border-b border-black/10 py-9 md:py-10 lg:border-b-0',
                    // Duas colunas: régua vertical entre elas, some em 4 colunas.
                    index % 2 === 0 ? 'sm:border-r sm:border-black/10 sm:pr-8 lg:pr-0' : 'sm:pl-8 lg:pl-0',
                    index < steps.length - 1 ? 'lg:border-r lg:border-black/10' : '',
                    index === 0 ? 'lg:pr-8' : index === steps.length - 1 ? 'lg:pl-8' : 'lg:px-8',
                  ].join(' ')}
                >
                  <AnimatedSection>
                    <span className="mb-5 block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      {step.n}
                    </span>
                    {/* Em lg a coluna tem ~176px úteis: "Desenvolvimento" a
                        24px estoura sem ponto de quebra. Sobe só no xl. */}
                    <h3 className="text-xl font-black leading-tight tracking-tighter text-black xl:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-[34ch] text-pretty text-[15px] leading-relaxed text-gray-600">
                      {step.text}
                    </p>
                  </AnimatedSection>
                </Commentable>
              ))}
            </div>
          </div>
        </section>

        {/* ============ MANUTENÇÃO ============ */}
        <section id="manutencao" className={`${SECTION} bg-black py-24 md:py-32`}>
          <div className={SHELL}>
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-3 lg:gap-20">
              <Commentable id="manutencao-desc" className="lg:col-span-2">
                <AnimatedSection>
                  <span className="mb-6 inline-block rounded-full border border-white/20 px-4 py-1.5 text-[10px] font-bold uppercase leading-none tracking-[0.2em] text-gray-400">
                    Opcional · Adicione se quiser
                  </span>
                  <h2 className="text-balance text-3xl font-black uppercase leading-[0.95] tracking-tighter text-white md:text-5xl">
                    Manutenção mensal{' '}
                    <span className="text-gray-500">para o site sempre no ar.</span>
                  </h2>
                  <p className={`mt-6 ${LEAD} text-pretty text-lg leading-[1.6] text-gray-400`}>
                    Para não precisar pensar na parte técnica depois que o site estiver no ar.
                    Contratação separada, sem compromisso.
                  </p>
                  <ul className="mt-10 grid grid-cols-1 gap-x-12 gap-y-0 sm:grid-cols-2 md:mt-12">
                    {maintenanceItems.map((item) => (
                      <li
                        key={item}
                        className="border-b border-white/10 py-3.5 text-sm font-medium leading-snug text-gray-300"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </AnimatedSection>
              </Commentable>

              <Commentable id="manutencao-preco">
                <AnimatedSection>
                  <div className="border-t-2 border-white/20 pt-8 lg:border-l-2 lg:border-t-0 lg:pl-10 lg:pt-0">
                    <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                      Mensalidade a partir de
                    </span>
                    <p className="text-5xl font-black leading-none tracking-tighter text-white md:text-6xl">
                      R$&nbsp;350
                      <span className="text-xl font-normal tracking-normal text-gray-500">/mês</span>
                    </p>
                    <p className="mt-5 max-w-[30ch] text-sm leading-relaxed text-gray-500">
                      Contratação e cancelamento a qualquer momento.
                    </p>
                  </div>
                </AnimatedSection>
              </Commentable>
            </div>
          </div>
        </section>

        {/* ============ INFORMAÇÕES ============ */}
        <section id="info" className={`${SECTION} bg-white py-24 md:py-32`}>
          <div className={SHELL}>
            <Commentable id="info-intro">
              <AnimatedSection>
                <Kicker className="mb-5">Informações importantes</Kicker>
                <SectionTitle>
                  Condições, <span className="text-gray-400">por escrito.</span>
                </SectionTitle>
              </AnimatedSection>
            </Commentable>

            <div className="mt-12 grid grid-cols-1 border-t-2 border-black md:mt-16 md:grid-cols-2">
              {info.map((cell, index) => (
                <Commentable
                  key={cell.anchor}
                  id={cell.anchor}
                  className={`border-b border-black/10 py-9 md:py-12 ${
                    index % 2 === 0 ? 'md:border-r md:border-black/10 md:pr-12' : 'md:pl-12'
                  }`}
                >
                  <AnimatedSection>
                    <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      {cell.n}
                    </span>
                    <h3 className="text-xl font-black leading-tight tracking-tighter text-black md:text-2xl">
                      {cell.title}
                    </h3>
                    <p className={`mt-3 ${LEAD} text-pretty text-[15px] leading-relaxed text-gray-600 md:text-base`}>
                      {cell.text}
                    </p>
                  </AnimatedSection>
                </Commentable>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="bg-black py-28 md:py-40">
          <div className="mx-auto w-full max-w-4xl px-6 text-center md:px-8">
            <Commentable id="cta">
              <AnimatedSection>
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 md:text-sm">
                  Próximo passo
                </span>
                <h2 className="mt-6 text-balance text-4xl font-black uppercase leading-[0.92] tracking-tighter text-white md:text-6xl lg:text-7xl">
                  Vamos começar{' '}
                  <span className="text-gray-500">na semana que vem?</span>
                </h2>
                <p className="mx-auto mt-8 max-w-[46ch] text-pretty text-lg leading-[1.6] text-gray-400">
                  Aprovado o escopo, marcamos o briefing e o projeto entra em execução
                  imediatamente.
                </p>
                <div className="mt-12 flex flex-wrap justify-center gap-3 md:gap-4">
                  <PillLink href={APPROVE_LINK} dark>Aprovar proposta</PillLink>
                  <a
                    href={TALK_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block rounded-full border border-white/30 px-7 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:border-white hover:bg-white/5 md:px-8 ${focusRingDark}`}
                  >
                    Falar no WhatsApp
                  </a>
                  {/* `download` sugere salvar em vez de abrir no leitor do
                      navegador, que é o que se espera de "baixar". */}
                  <a
                    href={PDF_PATH}
                    download
                    className={`inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:border-white hover:bg-white/5 md:px-8 ${focusRingDark}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Baixar PDF
                  </a>
                </div>
              </AnimatedSection>
            </Commentable>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="border-t border-white/10 bg-black py-10 md:py-12">
          <div className={`${SHELL} flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left`}>
            <p className="text-sm leading-normal tracking-tight text-gray-500">
              João Gabriel dos Santos · Desenvolvimento Web
            </p>
            <p className="text-xs uppercase leading-normal tracking-[0.2em] text-gray-600">
              Proposta comercial · 2026
            </p>
          </div>
        </footer>

        <CommentsPanel />
      </div>
    </CommentsProvider>
  );
};

export default PropostaMarcelo;
