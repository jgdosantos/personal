import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PERGUNTAS, TOTAL, copy, semTags } from './content.js';
import { gravarUltimoEnvio, lerUltimoEnvio, serializar } from './storage.js';
import { copiar, montarTexto, planoWhatsApp } from './fallback.js';

// Pílula do brief: 980px de raio, 12px 24px de padding, peso 500. Transição só
// em cor e opacidade, 200ms — nada mais é autorizado nesta página.
const PILULA = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus-visible:shadow-[0_0_0_4px_rgba(0,113,227,0.15)]';
const RAIO_PILULA = { borderRadius: 980, padding: '12px 24px', minHeight: 44 };

const BarraRodape = ({ respostas, preenchidas, respondente, sessao, onEnviado }) => {
  const [estado, setEstado] = useState('parado'); // parado | enviando | enviado
  const [ultimoEnvio, setUltimoEnvio] = useState(() => lerUltimoEnvio(respondente));
  const [falhou, setFalhou] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [textoNaTela, setTextoNaTela] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const jaEnviou = Boolean(ultimoEnvio);
  const pendente = jaEnviou && serializar(respostas) !== ultimoEnvio;

  // Só monta o texto do plano B quando ele está na tela: são 48 perguntas, e a
  // barra re-renderiza a cada tecla.
  const textoFallback = useMemo(
    () => (falhou ? montarTexto({ respondente, respostas }) : ''),
    [falhou, respondente, respostas],
  );
  const plano = useMemo(
    () => (textoFallback ? planoWhatsApp(textoFallback) : null),
    [textoFallback],
  );

  const enviar = useCallback(async () => {
    setEstado('enviando');
    setCopiado(false);
    setTextoNaTela('');

    // Percorre PERGUNTAS, não Object.keys(respostas): o brief quer as 48 na
    // planilha, inclusive as vazias, para os buracos ficarem visíveis. Iterar
    // pelas respostas faria a pergunta não respondida sumir e a aba perder a
    // linha.
    const corpo = {
      respondente,
      sessao,
      total: TOTAL,
      preenchidas,
      respostas: PERGUNTAS.map((p) => ({
        id: p.id,
        n: p.n,
        bloco: p.bloco,
        pergunta: semTags(p.texto),
        prioridade: p.prioridade,
        resposta: respostas[p.id] || '',
      })),
    };

    try {
      const res = await fetch('/api/perguntas-ligia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const dados = await res.json().catch(() => null);

      // Espelha o servidor: `ok: true` explícito, nunca só o status HTTP.
      if (!res.ok || !dados || dados.ok !== true) throw new Error('recusado');

      gravarUltimoEnvio(respondente, respostas);
      setUltimoEnvio(serializar(respostas));
      setFalhou(false);
      setEstado('enviado');
      onEnviado();
      timer.current = setTimeout(() => setEstado('parado'), 4000);
    } catch {
      // Nenhuma mensagem técnica na tela dela, e NADA é apagado do
      // localStorage em caminho de erro nenhum: ela não perde uma letra.
      setEstado('parado');
      setFalhou(true);
    }
  }, [onEnviado, preenchidas, respondente, respostas, sessao]);

  const aoCopiar = useCallback(async () => {
    const ok = await copiar(textoFallback);
    setCopiado(ok);
    // Não conseguiu copiar (contexto não seguro, permissão negada): mostra o
    // texto num campo selecionável em vez de terminar em silêncio.
    if (!ok) setTextoNaTela(textoFallback);
  }, [textoFallback]);

  const aoMandarNoWhats = useCallback(() => {
    if (plano && plano.curta) {
      copiar(textoFallback).then((ok) => {
        setCopiado(ok);
        if (!ok) setTextoNaTela(textoFallback);
      });
    }
  }, [plano, textoFallback]);

  const enviando = estado === 'enviando';
  const desabilitado = enviando || preenchidas === 0;

  const rotulo = enviando
    ? copy.botao.enviando
    : estado === 'enviado'
      ? copy.botao.enviado
      : jaEnviou ? copy.botao.reenviar : copy.botao.enviar;

  const corDoBotao = desabilitado
    ? { background: '#E8E8ED', color: '#86868B' }
    : estado === 'enviado'
      // Verde só aqui: é o único estado em que o brief autoriza o #1D8A4E.
      ? { background: '#1D8A4E', color: '#FFFFFF' }
      : { background: '#0071E3', color: '#FFFFFF' };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E8E8ED]"
      style={{
        background: 'rgba(255,255,255,.72)',
        // -webkit- junto: é o Safari dela que precisa disso.
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Barra de progresso sem transition na largura: o brief só autoriza
          200ms em cor e opacidade. Ela pula de valor, e é o certo. */}
      <div
        className="h-[3px] w-full bg-[#E8E8ED]"
        role="progressbar"
        aria-valuenow={preenchidas}
        aria-valuemin={0}
        aria-valuemax={TOTAL}
        aria-label="perguntas respondidas"
      >
        <div className="h-full bg-[#0071E3]" style={{ width: `${(preenchidas / TOTAL) * 100}%` }} />
      </div>

      <div className="mx-auto w-full max-w-[720px] px-6 py-3">
        {pendente && estado !== 'enviado' && (
          <p className="mb-2 text-[13px] text-[#86868B]" aria-live="polite">
            {copy.avisoNaoEnviado}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] text-[#86868B]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {copy.contador(preenchidas)}
          </span>

          <button
            type="button"
            onClick={enviar}
            disabled={desabilitado}
            aria-busy={enviando}
            className={PILULA}
            style={{ ...RAIO_PILULA, ...corDoBotao }}
          >
            {rotulo}
          </button>
        </div>

        {falhou && (
          <div className="mt-3 border-t border-[#E8E8ED] pt-3">
            <p className="text-[13px] font-semibold text-[#1D1D1F]">{copy.fallback.titulo}</p>
            <p className="mt-1 text-[13px] text-[#6E6E73]" style={{ lineHeight: 1.45 }}>
              {copy.fallback.texto}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={aoCopiar}
                className={`${PILULA} text-[13px]`}
                style={{ ...RAIO_PILULA, background: '#FFFFFF', color: '#1D1D1F', border: '1px solid #D2D2D7' }}
              >
                {copy.fallback.copiar}
              </button>

              {/* Âncora de verdade, não window.open: um clique dela vira
                  navegação nativa, sem chance de bloqueio de popup. */}
              <a
                href={plano ? plano.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={aoMandarNoWhats}
                className={`${PILULA} text-[13px]`}
                style={{ ...RAIO_PILULA, background: '#FFFFFF', color: '#1D1D1F', border: '1px solid #D2D2D7' }}
              >
                {copy.fallback.whatsapp}
              </a>

              <span className="text-[13px] text-[#86868B]" aria-live="polite">
                {copiado ? copy.fallback.copiado : ''}
              </span>
            </div>

            {plano && plano.curta && (
              <p className="mt-2 text-[13px] text-[#86868B]" style={{ lineHeight: 1.45 }}>
                Suas respostas são longas: copiei tudo aqui no aparelho. No WhatsApp,
                mande a mensagem curta e cole o resto na mensagem seguinte.
              </p>
            )}

            {textoNaTela && (
              <textarea
                readOnly
                value={textoNaTela}
                rows={6}
                className="mt-3 block w-full resize-none border border-[#D2D2D7] bg-[#FFFFFF] px-3 py-2 text-[13px] text-[#1D1D1F]"
                style={{ borderRadius: 12 }}
                aria-label="suas respostas, para copiar à mão"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarraRodape;
