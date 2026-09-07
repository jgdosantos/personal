import React, { memo, useCallback, useLayoutEffect, useRef } from 'react';
import { splitMarcado } from './content.js';

// Uma linha por padrão, cresce conforme ela escreve, nunca com barra de
// rolagem interna. Zerar antes de medir é obrigatório: sem isso o scrollHeight
// nunca diminui e o campo só cresce, mesmo quando ela apaga texto.
const ajusta = (el) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

/**
 * Uma pergunta: cabeçalho (número, ★ de prioridade, ✓ de respondida), o texto,
 * a dica opcional e o campo.
 *
 * React.memo NÃO é otimização opcional aqui. São 48 textareas controladas por
 * um único objeto de estado no topo: sem a memoização, cada tecla
 * re-renderizaria as 48. No desktop ninguém percebe; no celular dela isso é
 * digitação engasgada — que é justamente o que a página inteira tenta evitar.
 * O `onChange` que vem do pai é estável (useCallback + setState funcional),
 * então os outros 47 param na comparação de props.
 */
const Pergunta = memo(({ n, id, texto, prioridade, dica, valor, onChange }) => {
  const ref = useRef(null);

  // useLayoutEffect, não useEffect: é ele que faz a resposta longa restaurada
  // do localStorage abrir já com a altura certa na primeira pintura, em vez de
  // aparecer como uma linha só e "pular" logo depois.
  useLayoutEffect(() => { ajusta(ref.current); }, [valor]);

  const aoDigitar = useCallback((evento) => {
    ajusta(evento.target);
    onChange(id, evento.target.value);
  }, [id, onChange]);

  const respondida = Boolean(valor && valor.trim());

  return (
    <div
      // 14px em cima e 14px embaixo dão os ~28px que o brief pede ENTRE
      // perguntas. scroll-margin-bottom impede o navegador de parar a rolagem
      // com o campo em foco debaixo da barra fixa do rodapé.
      style={{
        borderTop: '1px solid #E8E8ED',
        paddingTop: 14,
        paddingBottom: 14,
        scrollMarginBottom: 120,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[#86868B]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {n}
        </span>
        {prioridade && (
          // O glifo continua sendo uma estrela porque um dos cartõezinhos do
          // topo é copy literal e diz "As com ★ primeiro". Trocar por um ponto
          // azul ou pela palavra "Prioridade" faria o cartão apontar para um
          // símbolo que não existe na página.
          <span className="text-[11px] text-[#86868B]" aria-label="prioridade" role="img">★</span>
        )}
        {respondida && (
          // aria-hidden de propósito: a informação já está no valor do campo, e
          // um leitor de tela anunciando "check" 48 vezes seria ruído.
          <span className="text-[12px] text-[#1D8A4E]" aria-hidden="true">✓</span>
        )}
      </div>

      <label
        htmlFor={`pergunta-${id}`}
        className="mt-1 block text-[17px] text-[#1D1D1F]"
        style={{ lineHeight: 1.55 }}
      >
        {/* splitMarcado devolve dados; o JSX é montado aqui. Nada de
            dangerouslySetInnerHTML — mesma técnica do renderRichText do App.jsx. */}
        {splitMarcado(texto).map((parte, i) => (
          parte.tipo === 'italico'
            ? <em key={i}>{parte.texto}</em>
            : <React.Fragment key={i}>{parte.texto}</React.Fragment>
        ))}
      </label>

      {dica ? (
        <p className="mt-1.5 text-[13px] text-[#86868B]" style={{ lineHeight: 1.45 }}>
          {dica}
        </p>
      ) : null}

      <textarea
        id={`pergunta-${id}`}
        ref={ref}
        rows={1}
        value={valor || ''}
        onChange={aoDigitar}
        // A borda NÃO muda de cor quando preenchida: é regra explícita do
        // brief. O sinal de respondida é só o ✓ discreto lá em cima.
        //
        // No foco, o anel do macOS que o brief pede: borda #0071E3 e um halo
        // suave de 4px. Em utilidade, não em style inline, porque style inline
        // venceria a variante focus: e o halo nunca apareceria.
        className="mt-3 block w-full resize-none overflow-hidden border border-[#D2D2D7] bg-[#FFFFFF] px-4 py-3 text-[17px] text-[#1D1D1F] transition-colors duration-200 focus:border-[#0071E3] focus:shadow-[0_0_0_4px_rgba(0,113,227,0.15)] focus:outline-none"
        style={{
          borderRadius: 12,
          lineHeight: 1.55,
          minHeight: 48,
        }}
      />
    </div>
  );
});

Pergunta.displayName = 'Pergunta';

export default Pergunta;
