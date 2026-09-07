import React, { useEffect } from 'react';
import { copy } from './content.js';

// Espaçamentos do brief, num lugar só em vez de espalhados pelo JSX:
// ~72px entre blocos, ~28px entre perguntas, coluna de 720px.
//
// Local, sem export: o plugin react-refresh recusa arquivo de componente que
// também exporta constante, e o valor não interessa a mais ninguém.
const ESPACO = {
  entreBlocos: 72,
  entrePerguntas: 28,
  // Reserva a altura da barra fixa do rodapé (T6) mais a área segura do
  // iPhone. Sem isso a barra cobre a última pergunta e o campo em foco.
  fundoDaPagina: 'calc(112px + env(safe-area-inset-bottom))',
};

const Topo = () => (
  <header>
    <p
      className="text-[13px] text-[#86868B]"
      style={{ letterSpacing: '0.01em' }}
    >
      {copy.sobretitulo}
    </p>

    {/* Os números do clamp, do letter-spacing e do line-height são literais do
        brief. Inline em vez de utilidade arbitrária, seguindo o precedente do
        BriefForm.jsx — clamp com vírgulas dentro de colchete do Tailwind é
        território de escape frágil. */}
    <h1
      className="mt-3 font-semibold text-[#1D1D1F]"
      style={{
        fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
        letterSpacing: '-0.03em',
        lineHeight: 1.05,
      }}
    >
      {copy.titulo}
    </h1>

    <div className="mt-7 space-y-4">
      {copy.intro.map((paragrafo) => (
        <p
          key={paragrafo.slice(0, 24)}
          className="text-[17px] text-[#6E6E73]"
          style={{ lineHeight: 1.55 }}
        >
          {paragrafo}
        </p>
      ))}
    </div>

    {/* Sem sombra, sem ícone, sem emoji: o que organiza é espaço, não moldura. */}
    <ul className="mt-8 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
      {copy.cartoes.map((cartao) => (
        <li
          key={cartao.titulo}
          className="bg-[#FFFFFF] p-4"
          style={{ borderRadius: 12, border: '1px solid #E8E8ED' }}
        >
          <p className="text-[13px] font-semibold text-[#1D1D1F]">{cartao.titulo}</p>
          <p className="mt-1 text-[13px] text-[#86868B]" style={{ lineHeight: 1.45 }}>
            {cartao.texto}
          </p>
        </li>
      ))}
    </ul>
  </header>
);

const PerguntasLigia = () => {
  useEffect(() => {
    document.title = 'De Maria · antes de montar a sua loja';

    // O fundo #FBFBFD e o color-scheme precisam viver na raiz, não só na
    // página: sem isso o overscroll do iOS mostra faixa branca e o aparelho
    // dela pode inverter as cores sozinho.
    document.documentElement.classList.add('perguntas-root');

    // Cinto e suspensório: a regra do vercel.json não roda em `npm run dev`
    // nem em preview local, e questionário de cliente indexado não dá para
    // desfazer depois. Mesmo padrão do BriefForm.jsx.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);

    return () => {
      document.documentElement.classList.remove('perguntas-root');
      meta.remove();
    };
  }, []);

  return (
    <div className="perguntas-page">
      <div
        className="mx-auto w-full max-w-[720px] px-6 pt-16 sm:pt-24"
        style={{ paddingBottom: ESPACO.fundoDaPagina }}
      >
        <Topo />

        {/* Os 7 blocos com as 48 perguntas entram aqui na T5. */}
        <main style={{ marginTop: ESPACO.entreBlocos }} />
      </div>
    </div>
  );
};

export default PerguntasLigia;
