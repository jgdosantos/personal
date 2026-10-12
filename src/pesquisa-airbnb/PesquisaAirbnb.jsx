import { useEffect, useRef, useState } from 'react';
import { ESCOLHAS, LIMITES, validar } from '../../shared/pesquisaAirbnb.js';

// Formulário de validação do vídeo 3D para imóveis de temporada. Uma tela só,
// sem etapas. As perguntas de escolha vêm de shared/pesquisaAirbnb.js, a mesma
// lista que a API usa como allowlist.

const VAZIO = { nome: '', contato: '', imoveis: '', interesse: '', pagaria: '', site: '' };

const CAMPO =
  'block w-full border border-[#D2D2D7] bg-[#FFFFFF] px-4 py-3 text-[17px] text-[#1D1D1F] transition-colors duration-200 focus:border-[#0071E3] focus:shadow-[0_0_0_4px_rgba(0,113,227,0.15)] focus:outline-none';
const CAMPO_STYLE = { borderRadius: 12, lineHeight: 1.55, minHeight: 48 };

const Titulo = () => (
  <h1
    className="font-semibold text-[#1D1D1F]"
    style={{
      fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
      letterSpacing: '-0.03em',
      lineHeight: 1.05,
    }}
  >
    Vídeo 3D do seu imóvel
  </h1>
);

export default function PesquisaAirbnb() {
  const [form, setForm] = useState(VAZIO);
  const [estado, setEstado] = useState('parado'); // parado | enviando | erro | enviado
  const confirmacao = useRef(null);

  // Mesma regra do servidor: o botão só habilita quando a API aceitaria.
  const completo = validar(form).ok;

  useEffect(() => {
    document.title = 'Vídeo 3D do seu imóvel';

    // Fundo e color-scheme na raiz, para o overscroll do iOS não mostrar faixa
    // branca e o aparelho não inverter as cores.
    document.documentElement.classList.add('pesquisa-root');

    // Cinto e suspensório: o header do vercel.json não roda em `npm run dev`.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);

    return () => {
      document.documentElement.classList.remove('pesquisa-root');
      meta.remove();
    };
  }, []);

  useEffect(() => {
    if (estado === 'enviado' && confirmacao.current) confirmacao.current.focus();
  }, [estado]);

  const mudar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setEstado((e) => (e === 'erro' ? 'parado' : e));
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    if (!completo || estado === 'enviando') return;
    setEstado('enviando');
    try {
      const res = await fetch('/api/pesquisa-airbnb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const dados = await res.json().catch(() => null);
      if (res.ok && dados && dados.ok === true) {
        setEstado('enviado');
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        setEstado('erro');
      }
    } catch {
      setEstado('erro');
    }
  };

  const enviando = estado === 'enviando';

  return (
    <div className="pesquisa-page">
      <div className="mx-auto w-full max-w-[560px] px-6 pt-16 pb-24 sm:pt-24">
        <Titulo />

        {estado === 'enviado' ? (
          <p
            ref={confirmacao}
            tabIndex={-1}
            className="mt-7 text-[17px] text-[#1D1D1F] focus:outline-none"
            style={{ lineHeight: 1.55 }}
          >
            Obrigado! Se você tiver interesse, entramos em contato pelo contato informado.
          </p>
        ) : (
          <>
            <p className="mt-7 text-[17px] text-[#6E6E73]" style={{ lineHeight: 1.55 }}>
              Um vídeo que percorre o imóvel como se o hóspede estivesse andando por ele. É{' '}
              <strong className="font-semibold text-[#1D1D1F]">gerado por inteligência artificial</strong>{' '}
              a partir das fotos que você já tem, sem precisar de visita. Leva 1 minuto para responder.
            </p>

            <form noValidate onSubmit={enviar} className="mt-10 flex flex-col" style={{ gap: 28 }}>
              <div>
                <label htmlFor="pesquisa-nome" className="mb-2 block text-[15px] font-medium text-[#1D1D1F]">
                  Nome
                </label>
                <input
                  id="pesquisa-nome"
                  type="text"
                  className={CAMPO}
                  style={CAMPO_STYLE}
                  placeholder="Seu nome"
                  autoComplete="name"
                  maxLength={LIMITES.nome}
                  required
                  value={form.nome}
                  onChange={(e) => mudar('nome', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="pesquisa-contato" className="mb-2 block text-[15px] font-medium text-[#1D1D1F]">
                  Contato
                </label>
                <input
                  id="pesquisa-contato"
                  type="text"
                  className={CAMPO}
                  style={CAMPO_STYLE}
                  placeholder="WhatsApp ou e-mail"
                  maxLength={LIMITES.contato}
                  required
                  value={form.contato}
                  onChange={(e) => mudar('contato', e.target.value)}
                />
              </div>

              {ESCOLHAS.map(({ id, pergunta, opcoes }) => (
                <fieldset key={id} className="border-0 p-0" style={{ marginInline: 0, marginBottom: 0 }}>
                  <legend className="mb-3 p-0 text-[17px] font-medium text-[#1D1D1F]">{pergunta}</legend>
                  <div className="flex flex-col gap-2">
                    {opcoes.map((opcao) => {
                      const marcada = form[id] === opcao;
                      return (
                        <label
                          key={opcao}
                          className="relative flex cursor-pointer items-center justify-center px-4 text-[17px] transition-colors duration-200 focus-within:shadow-[0_0_0_4px_rgba(0,113,227,0.15)]"
                          style={{
                            minHeight: 48,
                            borderRadius: 12,
                            border: `1px solid ${marcada ? '#0071E3' : '#D2D2D7'}`,
                            backgroundColor: marcada ? '#0071E3' : '#FFFFFF',
                            color: marcada ? '#FFFFFF' : '#1D1D1F',
                          }}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            name={id}
                            value={opcao}
                            checked={marcada}
                            onChange={() => mudar(id, opcao)}
                            required
                          />
                          <span>{opcao}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

              {/* Honeypot: invisível para humano, bot preenche. */}
              <div
                aria-hidden="true"
                style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
              >
                <label>
                  Site
                  <input
                    type="text"
                    name="site"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.site}
                    onChange={(e) => mudar('site', e.target.value)}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3">
                {estado === 'erro' && (
                  <p role="alert" className="text-[15px] text-[#1D1D1F]">
                    Não deu para enviar agora. Confira a conexão e toque em Enviar de novo.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!completo || enviando}
                  aria-busy={enviando}
                  className="inline-flex w-full items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus-visible:shadow-[0_0_0_4px_rgba(0,113,227,0.15)] sm:w-auto"
                  style={{
                    borderRadius: 980,
                    padding: '12px 24px',
                    minHeight: 44,
                    backgroundColor: !completo || enviando ? '#E8E8ED' : '#0071E3',
                    color: !completo || enviando ? '#86868B' : '#FFFFFF',
                    cursor: !completo || enviando ? 'not-allowed' : 'pointer',
                  }}
                >
                  {enviando ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
