import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SECOES, PERGUNTAS, copy, estaRespondida } from './content.js';
import Decisao, { Marcado } from './Decisao.jsx';
import Revisao from './Revisao.jsx';
import BarraRodape from './BarraRodape.jsx';
import { Enviado } from './Enviado.jsx';
import { gravarRespostas, lerOuCriarSessao, lerRespostas } from './storage.js';

// Espaçamentos num lugar só em vez de espalhados pelo JSX: ~72px entre seções,
// ~28px entre perguntas, coluna de 720px.
//
// Local, sem export: o plugin react-refresh recusa arquivo de componente que
// também exporta constante, e o valor não interessa a mais ninguém.
const ESPACO = {
  entreSecoes: 72,
  entrePerguntas: 28,
  // Reserva a altura da barra fixa do rodapé mais a área segura do iPhone. Sem
  // isso a barra cobre a última decisão e o campo em foco.
  fundoDaPagina: 'calc(112px + env(safe-area-inset-bottom))',
};

// Índice id → item achatado de PERGUNTAS (que é quem tem o `n` contínuo e o
// `bloco`). Montado uma vez, fora do render: um find() por pergunta a cada
// tecla devolveria objetos idênticos e só gastaria trabalho — mas, pior, é o
// tipo de custo que some no desktop e aparece no celular dela.
const POR_ID = new Map(PERGUNTAS.map((p) => [p.id, p]));

const Topo = () => (
  <header>
    <p className="text-[13px] text-[#86868B]" style={{ letterSpacing: '0.01em' }}>
      {copy.sobretitulo}
    </p>

    {/* clamp, letter-spacing e line-height inline em vez de utilidade
        arbitrária, seguindo o precedente do BriefForm.jsx — clamp com vírgulas
        dentro de colchete do Tailwind é território de escape frágil. */}
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
          {/* O parágrafo que cita "precisa antes de abrir" é a LEGENDA da marca
              de trava. Renderizado pelo mesmo <Marcado> que a pílula da
              pergunta usa, para as duas serem visivelmente a mesma coisa. */}
          <Marcado texto={paragrafo} />
        </p>
      ))}
    </div>
  </header>
);

const Secao = ({ secao, respostas, onChange }) => {
  // Mesma regra de "respondida" do ✓ da pergunta, do contador do rodapé e da
  // revisão: uma função só, importada. Quatro lugares divergindo aqui seria a
  // Ligia lendo "3 de 3" com um campo ainda vazio.
  const respondidasNaSecao = secao.qs.filter((p) => estaRespondida(p, respostas[p.id])).length;

  return (
    <section style={{ marginBottom: ESPACO.entreSecoes }}>
      {secao.rotulo && (
        <p className="text-[13px] text-[#86868B]" style={{ letterSpacing: '0.01em' }}>
          {secao.rotulo}
        </p>
      )}

      {/* Título e contador na mesma linha, alinhados pela baseline. O contador
          não encolhe; quem quebra é o título, que tem espaço para isso. */}
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h2
          className="font-semibold text-[#1D1D1F]"
          style={{ fontSize: '1.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
        >
          {secao.t}
        </h2>
        <span
          className="flex-shrink-0 text-[13px] text-[#86868B]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
          aria-label={`${respondidasNaSecao} de ${secao.qs.length} respondidas nesta parte`}
        >
          {copy.contadorSecao(respondidasNaSecao, secao.qs.length)}
        </span>
      </div>

      <p className="mt-2 text-[15px] text-[#6E6E73]" style={{ lineHeight: 1.5 }}>
        <Marcado texto={secao.sub} />
      </p>

      {/* O aviso dos 7 dias vem ANTES das perguntas da Parte 3: as quatro
          escolhas de devolução só fazem sentido depois de ela saber o que já é
          lei. Sem fundo colorido e sem ícone — o que separa é a barra à
          esquerda, como no resto da casa. */}
      {secao.aviso && (
        <div className="mt-6" style={{ borderLeft: '2px solid #E8E8ED', paddingLeft: 16 }}>
          {secao.aviso.map((paragrafo, i) => (
            <p
              key={paragrafo.slice(0, 24)}
              className="text-[15px] text-[#6E6E73]"
              style={{ lineHeight: 1.55, marginTop: i === 0 ? 0 : 12 }}
            >
              <Marcado texto={paragrafo} />
            </p>
          ))}
        </div>
      )}

      <div className="mt-6">
        {secao.qs.map((pergunta) => (
          <Decisao
            key={pergunta.id}
            pergunta={POR_ID.get(pergunta.id)}
            valor={respostas[pergunta.id]}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
};

const DecisoesLigia = () => {
  const [sessao] = useState(lerOuCriarSessao);

  // O estado de "já enviou com sucesso" vive AQUI, no pai, porque quem troca a
  // tela é a página — a barra só avisa.
  const [naTela, setNaTela] = useState(false);
  const marcarEnviado = useCallback(() => {
    setNaTela(true);
    // A confirmação nasce no topo. Herdar o scroll do fim da página faria a
    // tela abrir já rolada, e ela veria só o texto de privacidade.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  const voltarAsRespostas = useCallback(() => setNaTela(false), []);

  // Hidratar aqui, e não num useEffect: inicializar em efeito faz a página
  // piscar vazia antes de restaurar, e ela acharia que perdeu tudo.
  const [respostas, setRespostas] = useState(lerRespostas);

  // Estável entre renders — é o que permite ao memo de Decisao funcionar. O
  // setState funcional evita depender de `respostas` e recriar a função a cada
  // tecla, que anularia a memoização das outras 15.
  const onChange = useCallback((id, valor) => {
    setRespostas((anterior) => {
      const proximo = { ...anterior, [id]: valor };
      gravarRespostas(proximo);
      return proximo;
    });
  }, []);

  // Conta sobre PERGUNTAS, não sobre as chaves de `respostas`: uma chave órfã no
  // localStorage (id antigo, outra página) inflaria o contador e a barra diria
  // "17 de 16".
  const preenchidas = useMemo(
    () => PERGUNTAS.filter((p) => estaRespondida(p, respostas[p.id])).length,
    [respostas],
  );

  useEffect(() => {
    document.title = 'De Maria · as suas escolhas';

    // O fundo #FBFBFD e o color-scheme precisam viver na raiz, não só na
    // página: sem cor na raiz o overscroll do iOS mostra faixa branca, e sem
    // color-scheme o aparelho dela pode inverter as cores sozinho.
    document.documentElement.classList.add('decisoes-root');

    // Cinto e suspensório: a regra do vercel.json não roda em `npm run dev` nem
    // em preview local, e página de cliente indexada não dá para desfazer.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);

    return () => {
      document.documentElement.classList.remove('decisoes-root');
      meta.remove();
    };
  }, []);

  if (naTela) {
    return <Enviado preenchidas={preenchidas} onVoltar={voltarAsRespostas} />;
  }

  return (
    <div className="decisoes-page">
      <div
        className="mx-auto w-full max-w-[720px] px-6 pt-16 sm:pt-24"
        style={{ paddingBottom: ESPACO.fundoDaPagina }}
      >
        <Topo />

        <main style={{ marginTop: ESPACO.entreSecoes }}>
          {SECOES.map((secao) => (
            <Secao
              key={secao.t}
              secao={secao}
              respostas={respostas}
              onChange={onChange}
            />
          ))}

          {/* A conferência vem depois das perguntas e ANTES do encerramento: o
              documento põe o "Terminou?" antes do Anexo A, o que na tela diria
              "é isso" e em seguida faria mais três perguntas. */}
          <Revisao respostas={respostas} />
        </main>

        <footer style={{ borderTop: '1px solid #E8E8ED', paddingTop: ESPACO.entrePerguntas }}>
          <h2
            className="font-semibold text-[#1D1D1F]"
            style={{ fontSize: '1.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            {copy.encerramento.titulo}
          </h2>
          {copy.encerramento.paragrafos.map((paragrafo) => (
            <p
              key={paragrafo.slice(0, 24)}
              className="mt-4 text-[17px] text-[#6E6E73]"
              style={{ lineHeight: 1.55 }}
            >
              <Marcado texto={paragrafo} />
            </p>
          ))}

          <p className="mt-10 text-[13px] text-[#86868B]" style={{ lineHeight: 1.5 }}>
            {copy.privacidade}
          </p>
        </footer>
      </div>

      <BarraRodape
        respostas={respostas}
        preenchidas={preenchidas}
        sessao={sessao}
        onEnviado={marcarEnviado}
      />
    </div>
  );
};

export default DecisoesLigia;
