import React, { memo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { copy, splitMarcado, respostaDe, ASPAS } from './content.js';

// Uma linha por padrão, cresce conforme ela escreve, nunca com barra de rolagem
// interna. Zerar antes de medir é obrigatório: sem isso o scrollHeight nunca
// diminui e o campo só cresce, mesmo quando ela apaga texto.
const ajusta = (el) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

/**
 * Renderiza **negrito** e <em>itálico</em> a partir de dados, sem
 * dangerouslySetInnerHTML — mesma técnica do renderRichText do App.jsx.
 *
 * Exportado daqui porque a abertura da página precisa exatamente do mesmo
 * renderizador: é o negrito de "precisa antes de abrir" na abertura que faz a
 * legenda e a pílula da pergunta serem visivelmente a mesma coisa. Duas
 * implementações divergiriam na primeira vez que alguém mexesse numa delas.
 */
export const Marcado = ({ texto }) => splitMarcado(texto).map((parte, i) => {
  if (parte.tipo === 'negrito') return <strong key={i} className="font-semibold text-[#1D1D1F]">{parte.texto}</strong>;
  if (parte.tipo === 'italico') return <em key={i}>{parte.texto}</em>;
  return <React.Fragment key={i}>{parte.texto}</React.Fragment>;
});

const CAMPO = 'block w-full border border-[#D2D2D7] bg-[#FFFFFF] px-4 py-3 text-[17px] text-[#1D1D1F] transition-colors duration-200 focus:border-[#0071E3] focus:shadow-[0_0_0_4px_rgba(0,113,227,0.15)] focus:outline-none';
const ESTILO_CAMPO = { borderRadius: 12, lineHeight: 1.55, minHeight: 48 };

/**
 * Uma linha de tabela.
 *
 * Nada de <table>: 720px de tabela numa tela de 375px estoura ou vira rolagem
 * lateral, e ela vai responder no celular. Duas colunas viram uma linha
 * esquerda/direita; a terceira coluna (só o A3 tem) vai ABAIXO, em 13px, porque
 * "o que muda" é frase inteira e espremê-la numa terceira coluna produziria uma
 * palavra por linha.
 */
const LinhaTabela = ({ celulas, cabecalho, primeira }) => (
  <div
    style={{
      borderTop: primeira ? 'none' : '1px solid #E8E8ED',
      padding: '10px 0',
    }}
  >
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className={`text-[15px] ${cabecalho ? 'text-[#86868B]' : 'text-[#1D1D1F]'}`}>
        {celulas[0]}
      </span>
      {celulas.length > 1 && (
        <span className="text-[15px] text-[#6E6E73]">{celulas[1]}</span>
      )}
    </div>
    {celulas.length > 2 && (
      <p className="mt-1 text-[13px] text-[#86868B]" style={{ lineHeight: 1.45 }}>
        {celulas[2]}
      </p>
    )}
  </div>
);

/**
 * Uma decisão: cabeçalho (número, marca de trava, ✓ de respondida), o título, a
 * citação dela, a explicação, a tabela e o campo.
 *
 * React.memo NÃO é otimização opcional: são 16 perguntas com radios e textareas
 * controladas por um único objeto de estado no topo. Sem a memoização, cada
 * tecla no campo "Outro" re-renderizaria as 16 — no desktop ninguém percebe; no
 * celular dela isso é digitação engasgada. O `onChange` que vem do pai é
 * estável (useCallback + setState funcional), então as outras 15 param na
 * comparação de props.
 */
const Decisao = memo(({ pergunta, valor, onChange }) => {
  const { id, n, tipo, titulo, trava, voceMeDisse, voceMeDisseFim, corpo, tabela, opcoes, exemplo, sufixo } = pergunta;

  const areaOutro = useRef(null);
  const areaTexto = useRef(null);
  const marcada = (valor && valor.opcao) || '';
  const texto = (valor && valor.texto) || '';
  const opcaoOutro = opcoes.find((o) => o.outro);
  const outroAberto = Boolean(opcaoOutro && marcada === opcaoOutro.rotulo);

  // useLayoutEffect, não useEffect: é ele que faz a resposta longa restaurada do
  // localStorage abrir já com a altura certa na primeira pintura, em vez de
  // aparecer como uma linha só e "pular" logo depois.
  useLayoutEffect(() => {
    ajusta(areaTexto.current);
    ajusta(areaOutro.current);
  }, [texto, outroAberto]);

  // Foco no campo "Outro" só quando ele ACABA de abrir. Focar em toda montagem
  // faria a página, ao ser restaurada com "Outro" já marcado, rolar sozinha até
  // o meio do questionário — ela abriria a página num lugar que não escolheu.
  const jaAbriu = useRef(outroAberto);
  useEffect(() => {
    if (outroAberto && !jaAbriu.current) areaOutro.current?.focus();
    jaAbriu.current = outroAberto;
  }, [outroAberto]);

  const aoMarcar = useCallback((evento) => {
    // O texto do "Outro" é PRESERVADO ao desmarcar: se ela voltar atrás, o que
    // escreveu continua lá. Quem decide se aquilo conta como resposta é o
    // respostaDe(), que só olha o texto quando a opção "Outro" está marcada.
    onChange(id, { opcao: evento.target.value, texto });
  }, [id, onChange, texto]);

  const aoDigitar = useCallback((evento) => {
    ajusta(evento.target);
    onChange(id, { opcao: marcada, texto: evento.target.value });
  }, [id, marcada, onChange]);

  const aoDigitarNumero = useCallback((evento) => {
    // Aceita vazio e não valida mais nada além de não ser negativo — número de
    // contato de WhatsApp não tem forma errada, tem chute.
    const bruto = evento.target.value;
    onChange(id, { opcao: '', texto: bruto.startsWith('-') ? '' : bruto });
  }, [id, onChange]);

  const respondida = Boolean(respostaDe(pergunta, valor));

  return (
    <div
      // 14px em cima e 14px embaixo dão os ~28px entre perguntas.
      // scroll-margin-bottom impede o navegador de parar a rolagem com o campo
      // em foco debaixo da barra fixa do rodapé.
      style={{
        borderTop: '1px solid #E8E8ED',
        paddingTop: 14,
        paddingBottom: 14,
        scrollMarginBottom: 120,
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-[#86868B]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {n}
        </span>

        {trava && (
          // A marca é a PALAVRA, nunca um símbolo: a abertura da página explica
          // essa marca com exatamente estas mesmas palavras, e um glifo
          // obrigaria a legenda a apontar para algo que ela não sabe ler.
          <span
            className="text-[12px] text-[#6E6E73]"
            style={{ border: '1px solid #E8E8ED', borderRadius: 980, padding: '2px 10px' }}
          >
            {copy.marcaTrava}
          </span>
        )}

        {respondida && (
          // aria-hidden de propósito: a informação já está no valor do campo, e
          // um leitor de tela anunciando "check" 16 vezes seria ruído.
          <span className="text-[12px] text-[#1D8A4E]" aria-hidden="true">✓</span>
        )}
      </div>

      <h3
        className="mt-1 text-[17px] font-medium text-[#1D1D1F]"
        style={{ lineHeight: 1.45 }}
        id={`decisao-${id}-titulo`}
      >
        {titulo}
      </h3>

      {voceMeDisse && (
        <p className="mt-3 text-[15px] text-[#6E6E73]" style={{ lineHeight: 1.5 }}>
          <strong className="font-semibold text-[#1D1D1F]">{copy.voceMeDisse}</strong>{' '}
          <em>{ASPAS[0]}{voceMeDisse}{ASPAS[1]}</em>
          {voceMeDisseFim ? ` ${voceMeDisseFim}` : null}
        </p>
      )}

      {corpo.map((paragrafo) => (
        <p
          key={paragrafo.slice(0, 32)}
          className="mt-3 text-[15px] text-[#6E6E73]"
          style={{ lineHeight: 1.5 }}
        >
          <Marcado texto={paragrafo} />
        </p>
      ))}

      {tabela && (
        <div className="mt-4" style={{ borderBottom: '1px solid #E8E8ED' }}>
          <LinhaTabela celulas={tabela.colunas} cabecalho primeira />
          {tabela.linhas.map((linha) => (
            <LinhaTabela key={linha[0]} celulas={linha} />
          ))}
        </div>
      )}

      {tipo === 'unica' && (
        // fieldset + legend oculta: o título já está na tela, mas sem o
        // agrupamento o leitor de tela lê cinco rádios soltos sem dizer de que
        // pergunta são.
        // O reset de margem é só nas laterais e embaixo. Um `margin: 0` inteiro
        // aqui venceria o `mt-4` da classe — style inline ganha da utilidade — e
        // as opções colariam no parágrafo da explicação.
        <fieldset
          className="mt-4 border-0 p-0"
          style={{ marginInline: 0, marginBottom: 0 }}
        >
          <legend className="sr-only">{titulo}</legend>
          <div className="flex flex-col gap-2">
            {opcoes.map((opcao) => {
              const escolhida = marcada === opcao.rotulo;
              return (
                <React.Fragment key={opcao.rotulo}>
                  {/* A linha inteira é o alvo de toque: <label> envolvendo o
                      input nativo. Nada de div role="radio" — o input de
                      verdade dá teclado, leitor de tela e agrupamento de graça. */}
                  <label
                    className="flex cursor-pointer items-center gap-3 bg-[#FFFFFF] px-4 transition-colors duration-200 focus-within:shadow-[0_0_0_4px_rgba(0,113,227,0.15)]"
                    style={{
                      border: `1px solid ${escolhida ? '#0071E3' : '#E8E8ED'}`,
                      borderRadius: 12,
                      minHeight: 44,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                  >
                    <input
                      type="radio"
                      name={id}
                      value={opcao.rotulo}
                      checked={escolhida}
                      onChange={aoMarcar}
                      className="h-[20px] w-[20px] flex-shrink-0 accent-[#0071E3]"
                      style={{ margin: 0 }}
                    />
                    <span className="text-[15px] text-[#1D1D1F]" style={{ lineHeight: 1.45 }}>
                      {opcao.rotulo}
                    </span>
                  </label>

                  {opcao.outro && escolhida && (
                    <textarea
                      ref={areaOutro}
                      rows={1}
                      value={texto}
                      onChange={aoDigitar}
                      aria-label={`${opcao.rotulo} — escreva do seu jeito`}
                      className={`${CAMPO} resize-none overflow-hidden`}
                      style={ESTILO_CAMPO}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </fieldset>
      )}

      {tipo === 'texto' && (
        <textarea
          id={`decisao-${id}`}
          ref={areaTexto}
          rows={1}
          value={texto}
          onChange={aoDigitar}
          placeholder={exemplo || ''}
          aria-labelledby={`decisao-${id}-titulo`}
          className={`${CAMPO} mt-4 resize-none overflow-hidden`}
          style={ESTILO_CAMPO}
        />
      )}

      {tipo === 'numero' && (
        <div className="mt-4 flex items-center gap-3">
          <input
            id={`decisao-${id}`}
            type="number"
            // inputMode para o teclado do celular dela já abrir numérico.
            inputMode="numeric"
            min="0"
            value={texto}
            onChange={aoDigitarNumero}
            aria-labelledby={`decisao-${id}-titulo`}
            className={CAMPO}
            style={{ ...ESTILO_CAMPO, maxWidth: 180 }}
          />
          <span className="text-[15px] text-[#86868B]">{sufixo}</span>
        </div>
      )}
    </div>
  );
});

Decisao.displayName = 'Decisao';

export default Decisao;
