import React from 'react';
import { PERGUNTAS, copy, semTags, respostaDe } from './content.js';

/**
 * "O que você respondeu" — a conferência do fim, item 6 do Anexo C.
 *
 * Lista APENAS as respondidas. Se nada foi respondido a seção não aparece:
 * uma lista vazia no fim de uma página longa só diria a ela que faltou tudo,
 * coisa que o contador da barra já diz sem ocupar meia tela.
 *
 * É conferência, não formulário: nenhum campo editável aqui. O campo dela está
 * logo acima, e duplicar a entrada duplicaria a fonte de verdade — dois lugares
 * para mudar a mesma escolha é como uma delas passa a mentir.
 */
const Revisao = ({ respostas }) => {
  const respondidas = PERGUNTAS
    .map((p) => ({ p, resposta: respostaDe(p, respostas[p.id]) }))
    .filter((item) => item.resposta);

  if (respondidas.length === 0) return null;

  return (
    <section style={{ marginBottom: 72 }}>
      <h2
        className="font-semibold text-[#1D1D1F]"
        style={{ fontSize: '1.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
      >
        {copy.revisao.titulo}
      </h2>

      <div className="mt-6">
        {respondidas.map(({ p, resposta }) => (
          <div key={p.id} style={{ borderTop: '1px solid #E8E8ED', padding: '12px 0' }}>
            <div className="flex gap-3">
              <span
                className="flex-shrink-0 text-[13px] text-[#86868B]"
                style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.6 }}
              >
                {p.n}
              </span>
              <div>
                <p className="text-[15px] text-[#1D1D1F]" style={{ lineHeight: 1.5 }}>
                  {semTags(p.titulo)}
                </p>
                <p className="mt-1 text-[15px] text-[#6E6E73]" style={{ lineHeight: 1.5 }}>
                  {resposta}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Revisao;
