import React, { useEffect, useRef } from 'react';
import { copy } from './content.js';

/**
 * A tela de confirmação, depois de um envio que a planilha aceitou.
 *
 * Ela substitui a página em vez de aparecer embaixo dela por um motivo prático:
 * no celular, um aviso no fim de uma página de 16 decisões fica atrás de muito
 * scroll, e a pergunta que ela faz nesse momento — "chegou?" — merece uma
 * resposta que ocupe a tela inteira.
 *
 * O caminho de volta é obrigatório, não cortesia: a página promete que ela pode
 * completar depois e enviar de novo, e uma tela final sem saída transformaria o
 * primeiro envio parcial num envio definitivo.
 *
 * NÃO persiste. Recarregar cai na página de novo, com o botão já dizendo
 * "Enviar de novo".
 */
const PILULA_AZUL = {
  background: '#0071E3',
  color: '#FFFFFF',
  borderRadius: '980px',
  padding: '12px 24px',
  fontWeight: 500,
};

export const Enviado = ({ preenchidas, onVoltar }) => {
  const foco = useRef(null);

  // A troca de tela não move o foco sozinha: quem usa leitor de tela ou teclado
  // continuaria no botão de enviar, que já não existe. Focar o título aqui é o
  // que faz a confirmação ser anunciada.
  useEffect(() => {
    foco.current?.focus();
  }, []);

  return (
    <div className="decisoes-page">
      <div
        className="mx-auto flex w-full max-w-[720px] flex-col justify-center px-6"
        style={{ minHeight: '100svh', paddingTop: '4rem', paddingBottom: '4rem' }}
      >
        {/* O verde só aparece aqui e no botão de sucesso do rodapé. Um ✓ sozinho
            diz mais que qualquer rótulo. */}
        <span
          aria-hidden="true"
          className="text-[#1D8A4E]"
          style={{ fontSize: '2rem', lineHeight: 1 }}
        >
          ✓
        </span>

        <h1
          ref={foco}
          tabIndex={-1}
          className="mt-6 font-semibold text-[#1D1D1F]"
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            outline: 'none',
          }}
        >
          {copy.telaEnviado.titulo}
        </h1>

        <p className="mt-6 text-[17px] text-[#6E6E73]" style={{ lineHeight: 1.55 }}>
          {copy.telaEnviado.texto}
        </p>

        <p
          className="mt-8 text-[13px] text-[#86868B]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {copy.telaEnviado.resumo(preenchidas)}
        </p>

        <div className="mt-8">
          <button
            type="button"
            onClick={onVoltar}
            className="transition-colors duration-200 hover:brightness-95"
            style={PILULA_AZUL}
          >
            {copy.telaEnviado.voltar}
          </button>
        </div>

        {/* A promessa de privacidade continua valendo depois do envio, e é aqui
            que ela para para ler. Sair da tela sem repeti-la seria escondê-la
            justamente no momento de mais atenção. */}
        <p className="mt-16 text-[13px] text-[#86868B]" style={{ lineHeight: 1.5 }}>
          {copy.privacidade}
        </p>
      </div>
    </div>
  );
};

export default Enviado;
