import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BLOCOS, PERGUNTAS, copy, splitMarcado } from './content.js';
import { gravarRespostas, lerOuCriarSessao, lerRespostas, respondenteDaUrl } from './storage.js';
import BarraRodape from './BarraRodape.jsx';
import Pergunta from './Pergunta.jsx';

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

// Renderiza **negrito** e <em>itálico</em> a partir de dados, sem
// dangerouslySetInnerHTML.
const Marcado = ({ texto }) => splitMarcado(texto).map((parte, i) => {
  if (parte.tipo === 'negrito') return <strong key={i} className="font-semibold">{parte.texto}</strong>;
  if (parte.tipo === 'italico') return <em key={i}>{parte.texto}</em>;
  return <React.Fragment key={i}>{parte.texto}</React.Fragment>;
});

// Primeiro número de cada bloco, calculado uma vez fora do render: a numeração
// é contínua ATRAVESSANDO os blocos (o bloco 2 começa no 9), e BLOCOS é
// estático — não há motivo para recontar a cada tecla.
const PRIMEIRO_N = BLOCOS.map(
  (_, i) => BLOCOS.slice(0, i).reduce((total, b) => total + b.qs.length, 0) + 1,
);

const Bloco = ({ bloco, primeiroN, respostas, onChange }) => (
  <section style={{ marginBottom: ESPACO.entreBlocos }}>
    <h2
      className="font-semibold text-[#1D1D1F]"
      style={{ fontSize: '1.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
    >
      {bloco.t}
    </h2>
    {/* O subtítulo explica a ela POR QUE a pergunta está sendo feita. O brief é
        explícito em que isso aumenta muito a taxa de resposta — não é enfeite. */}
    <p className="mt-2 text-[15px] text-[#6E6E73]" style={{ lineHeight: 1.5 }}>
      {bloco.sub}
    </p>

    {/* Divisória só ENTRE perguntas (a borda vive no topo de cada item), nunca
        em volta do bloco: sem card, sem moldura, sem sombra. */}
    <div className="mt-6">
      {bloco.qs.map(([id, texto, prioridade, dica], i) => (
        <Pergunta
          key={id}
          id={id}
          n={primeiroN + i}
          texto={texto}
          prioridade={prioridade === 1}
          dica={dica}
          valor={respostas[id]}
          onChange={onChange}
        />
      ))}
    </div>
  </section>
);

const PerguntasLigia = () => {
  // Resolvidos uma vez, na função inicial do useState.
  const [respondente] = useState(respondenteDaUrl);
  const [sessao] = useState(() => lerOuCriarSessao(respondenteDaUrl()));

  // O estado de "já enviou com sucesso" vive AQUI, no pai, porque quem troca o
  // bloco de fim de página é a página — a barra só avisa. Um callback estável
  // sobe o sinal; o contrário (estado na barra, leitura pelo pai) exigiria
  // levantar o estado depois de qualquer jeito.
  const [enviado, setEnviado] = useState(false);
  const marcarEnviado = useCallback(() => setEnviado(true), []);

  // Hidratar aqui, e não num useEffect: inicializar em efeito faz a página
  // piscar vazia antes de restaurar, e ela acharia que perdeu tudo.
  const [respostas, setRespostas] = useState(() => lerRespostas(respondenteDaUrl()));

  // Estável entre renders — é o que permite ao memo de Pergunta funcionar. O
  // setState funcional evita depender de `respostas` e recriar a função a cada
  // tecla, que anularia a memoização dos outros 47 campos.
  const onChange = useCallback((id, valor) => {
    setRespostas((anterior) => {
      const proximo = { ...anterior, [id]: valor };
      gravarRespostas(respondente, proximo);
      return proximo;
    });
  }, [respondente]);

  // Conta sobre PERGUNTAS, não sobre as chaves de `respostas`: uma chave
  // órfã no localStorage (id antigo, outro questionário) inflaria o contador
  // e a barra diria "49 de 48".
  const preenchidas = useMemo(
    () => PERGUNTAS.filter((p) => (respostas[p.id] || '').trim()).length,
    [respostas],
  );

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

        <main style={{ marginTop: ESPACO.entreBlocos }}>
          {BLOCOS.map((bloco, i) => (
            <Bloco
              key={bloco.t}
              bloco={bloco}
              primeiroN={PRIMEIRO_N[i]}
              respostas={respostas}
              onChange={onChange}
            />
          ))}
        </main>

        <footer style={{ borderTop: '1px solid #E8E8ED', paddingTop: ESPACO.entrePerguntas }}>
          <p className="text-[17px] text-[#6E6E73]" style={{ lineHeight: 1.55 }}>
            <Marcado texto={enviado ? copy.fimEnviado : copy.fim} />
          </p>
          <p className="mt-6 text-[13px] text-[#86868B]" style={{ lineHeight: 1.5 }}>
            {copy.privacidade}
          </p>
        </footer>
      </div>

      <BarraRodape
        respostas={respostas}
        preenchidas={preenchidas}
        respondente={respondente}
        sessao={sessao}
        onEnviado={marcarEnviado}
      />
    </div>
  );
};

export default PerguntasLigia;
