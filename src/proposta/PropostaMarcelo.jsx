import React, { useEffect } from 'react';
import { AnimatedSection } from '../lib/animation.jsx';
import { CommentsProvider } from './comments/store.jsx';
import { CommentsPanel } from './comments/CommentsPanel.jsx';
import { Commentable } from './comments/Commentable.jsx';
import {
  PROPOSAL_SLUG, meta, scope, steps, maintenanceItems, info, whatsappLink,
} from './content.js';

const APPROVE_LINK = whatsappLink(
  'Olá João! Vi a proposta do site institucional e quero aprovar. Podemos começar?'
);
const TALK_LINK = whatsappLink(
  'Olá João! Vi a proposta do site institucional e tenho algumas dúvidas.'
);

const Kicker = ({ children, className = '' }) => (
  <span className={`block text-sm font-bold uppercase tracking-[0.2em] text-gray-400 ${className}`}>
    {children}
  </span>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-black">
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
        ? 'inline-block rounded-full border border-white bg-white px-8 py-3 text-xs font-bold uppercase tracking-widest text-black transition-all duration-300 hover:bg-transparent hover:text-white'
        : 'inline-block rounded-full border border-black px-8 py-3 text-xs font-bold uppercase tracking-widest text-black transition-all duration-300 hover:bg-black hover:text-white'
    }
  >
    {children}
  </a>
);

const PropostaMarcelo = () => {
  useEffect(() => {
    document.title = 'Proposta · Site Institucional · João Gabriel';
  }, []);

  return (
    <CommentsProvider slug={PROPOSAL_SLUG}>
      <div className="min-h-screen bg-white">
        {/* ============ HEADER ============ */}
        <header className="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-white/80 px-6 py-4 backdrop-blur-sm md:px-8 md:py-6 print:hidden">
          <a href="/" className="text-sm font-black uppercase tracking-tighter text-black">
            João Gabriel
          </a>
          <nav className="hidden gap-8 md:flex">
            {[
              ['#escopo', 'Escopo'],
              ['#processo', 'Processo'],
              ['#manutencao', 'Manutenção'],
              ['#info', 'Informações'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-xs font-medium uppercase tracking-wider text-black transition-colors hover:text-gray-500 md:text-sm"
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href={APPROVE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-black bg-black px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-white hover:text-black md:text-xs"
          >
            Aprovar proposta
          </a>
        </header>

        {/* ============ HERO ============ */}
        <section className="relative flex min-h-screen items-center overflow-hidden bg-white pt-32 pb-20">
          <div className="pointer-events-none absolute right-0 top-1/2 z-0 -translate-y-1/2 select-none overflow-hidden text-right leading-none">
            <span className="block text-[30vw] font-black tracking-tighter text-black opacity-[0.05]">
              JG
            </span>
          </div>

          <div className="relative z-20 mx-auto w-full max-w-7xl px-6">
            <Commentable id="hero">
              <AnimatedSection>
                <Kicker className="mb-6">{meta.kicker}</Kicker>
                <h1
                  className="font-medium leading-[0.88] tracking-tighter text-black"
                  style={{ fontSize: 'clamp(2.75rem, 7vw, 128px)', marginLeft: '-0.05em' }}
                >
                  Um site que trabalha{' '}
                  <span className="text-gray-400">pelo seu negócio,</span>{' '}
                  24 horas por dia.
                </h1>
                <p className="mt-8 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
                  Presença digital pensada para converter visitantes em pacientes e agendamentos —
                  design exclusivo, performance real e uma estrutura preparada pra crescer junto
                  com sua empresa.
                </p>
              </AnimatedSection>
            </Commentable>

            <AnimatedSection className="mt-16 md:mt-24">
              <Commentable id="hero-meta">
                <dl className="grid grid-cols-1 gap-8 border-t-2 border-black pt-8 sm:grid-cols-3">
                  {[
                    ['Formato', meta.title],
                    ['Entrega', meta.delivery],
                    ['Investimento', meta.price],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        {label}
                      </dt>
                      <dd className="text-xl font-black tracking-tighter text-black md:text-2xl">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Commentable>
            </AnimatedSection>
          </div>
        </section>

        {/* ============ ESCOPO ============ */}
        <section id="escopo" className="bg-white py-20 md:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <AnimatedSection>
              <div className="flex flex-col gap-8 border-b-2 border-black pb-10 md:flex-row md:items-end md:justify-between">
                <div>
                  <Kicker className="mb-5">O que está incluso</Kicker>
                  <SectionTitle>
                    Escopo completo,<br className="hidden md:block" /> sem letras miúdas.
                  </SectionTitle>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
                    Cada item abaixo entra no valor apresentado. Funcionalidades fora desta lista
                    são orçadas separadamente e sempre aprovadas antes.
                  </p>
                </div>
                <div className="flex-shrink-0 md:text-right">
                  <Kicker className="mb-2">A partir de</Kicker>
                  <p className="text-5xl font-black tracking-tighter text-black md:text-6xl">
                    R$&nbsp;2.000
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
              {scope.map((item) => (
                <Commentable key={item.anchor} id={item.anchor}>
                  <AnimatedSection>
                    <div className="flex gap-5">
                      <span className="mt-1 text-xs font-bold tabular-nums tracking-widest text-gray-400">
                        {item.n}
                      </span>
                      <div>
                        <h3 className="flex flex-wrap items-center gap-3 text-xl font-black tracking-tighter text-black">
                          {item.title}
                          {item.badge && (
                            <span className="rounded-full border border-black/[0.08] bg-black/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                              {item.badge}
                            </span>
                          )}
                        </h3>
                        <p className="mt-2 leading-relaxed text-gray-600">{item.text}</p>
                      </div>
                    </div>
                  </AnimatedSection>
                </Commentable>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PROCESSO ============ */}
        <section id="processo" className="bg-white py-20 md:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <AnimatedSection>
              <Kicker className="mb-5">O processo</Kicker>
              <SectionTitle>Como o projeto acontece.</SectionTitle>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
                Do primeiro alinhamento à entrega final, um processo transparente — com valores
                claros, prazos definidos e nenhuma surpresa no meio do caminho.
              </p>
            </AnimatedSection>

            <div className="mt-14 grid grid-cols-1 border-t-2 border-black sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <Commentable
                  key={step.anchor}
                  id={step.anchor}
                  className={[
                    'border-b border-black/10 py-10 lg:border-b-0',
                    index < steps.length - 1 ? 'lg:border-r lg:border-black/10' : '',
                    index === 0 ? 'lg:pr-8' : index === steps.length - 1 ? 'lg:pl-8' : 'lg:px-8',
                  ].join(' ')}
                >
                  <AnimatedSection>
                    <span className="mb-5 block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      {step.n}
                    </span>
                    <h3 className="text-2xl font-black tracking-tighter text-black">{step.title}</h3>
                    <p className="mt-3 leading-relaxed text-gray-600">{step.text}</p>
                  </AnimatedSection>
                </Commentable>
              ))}
            </div>
          </div>
        </section>

        {/* ============ MANUTENÇÃO ============ */}
        <section id="manutencao" className="bg-black py-20 md:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-3 lg:gap-20">
              <Commentable id="manutencao-desc" className="lg:col-span-2">
                <AnimatedSection>
                  <span className="mb-6 inline-block rounded-full border border-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Opcional · Adicione se quiser
                  </span>
                  <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-tighter text-white md:text-5xl">
                    Manutenção mensal{' '}
                    <span className="text-gray-500">para o site sempre no ar.</span>
                  </h2>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
                    Para quem prefere não se preocupar com a parte técnica depois da entrega.
                    Contratação separada, sem compromisso obrigatório.
                  </p>
                  <ul className="mt-10 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
                    {maintenanceItems.map((item) => (
                      <li
                        key={item}
                        className="border-b border-white/10 pb-3 text-sm font-medium text-gray-300"
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
                    <p className="text-5xl font-black tracking-tighter text-white">
                      R$&nbsp;350
                      <span className="text-xl font-normal text-gray-500">/mês</span>
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-gray-500">
                      Contratação e cancelamento a qualquer momento.
                    </p>
                  </div>
                </AnimatedSection>
              </Commentable>
            </div>
          </div>
        </section>

        {/* ============ INFORMAÇÕES ============ */}
        <section id="info" className="bg-white py-20 md:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <AnimatedSection>
              <Kicker className="mb-5">Informações importantes</Kicker>
              <SectionTitle>
                Sem letras miúdas, <span className="text-gray-400">nunca.</span>
              </SectionTitle>
            </AnimatedSection>

            <div className="mt-14 grid grid-cols-1 border-t-2 border-black md:grid-cols-2">
              {info.map((cell, index) => (
                <Commentable
                  key={cell.anchor}
                  id={cell.anchor}
                  className={`border-b border-black/10 py-10 md:py-12 ${
                    index % 2 === 0 ? 'md:border-r md:border-black/10 md:pr-12' : 'md:pl-12'
                  }`}
                >
                  <AnimatedSection>
                    <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      {cell.n}
                    </span>
                    <h3 className="text-2xl font-black tracking-tighter text-black">{cell.title}</h3>
                    <p className="mt-3 leading-relaxed text-gray-600">{cell.text}</p>
                  </AnimatedSection>
                </Commentable>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="bg-black py-24 md:py-36">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <Commentable id="cta">
              <AnimatedSection>
                <span className="mb-6 block text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
                  Próximo passo
                </span>
                <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter text-white md:text-7xl">
                  Vamos começar{' '}
                  <span className="text-gray-500">na semana que vem?</span>
                </h2>
                <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-gray-400">
                  Aprovado o escopo, marcamos o briefing e o projeto entra em execução
                  imediatamente.
                </p>
                <div className="mt-12 flex flex-wrap justify-center gap-4">
                  <PillLink href={APPROVE_LINK} dark>Aprovar proposta</PillLink>
                  <a
                    href={TALK_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full border border-white/30 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:border-white hover:bg-white/5"
                  >
                    Falar no WhatsApp
                  </a>
                </div>
              </AnimatedSection>
            </Commentable>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="border-t border-white/10 bg-black py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-center sm:flex-row sm:text-left">
            <p className="text-sm tracking-tight text-gray-500">
              João Gabriel dos Santos · Desenvolvimento Web
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-600">
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
