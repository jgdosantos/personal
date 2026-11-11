import { useEffect, useRef, useState } from 'react';
import { whatsappLink } from '../lib/whatsapp.js';

// Questionário curto para o site da Dra. Daniela Morais. Dez perguntas, uma
// frase cada, pensado para o celular entre uma paciente e outra.
//
// O envio reusa /api/perguntas-ligia: o Apps Script por trás dele grava cada
// `respondente` numa aba própria da planilha privada do João e registra o
// envio na aba Historico. Nada de serviço novo nem de env var nova.

const RESPONDENTE = 'Daniela Morais';
const BLOCO = 'Site Dra. Daniela';

// Texto literal do pedido. Não reescrever.
const PERGUNTAS = [
  'Em uma frase: por que você escolheu cuidar de pele e cabelo?',
  'Onde e em que ano você se formou em Medicina?',
  'Onde fez a residência ou o título de especialista em Dermatologia, e qual é o seu número de RQE?',
  'Onde você fez a sua formação em Tricologia?',
  'De quais sociedades médicas você é membro hoje?',
  'Quais são os horários do consultório e em que horário a equipe responde o WhatsApp?',
  'Você atende algum convênio? Se não, a paciente recebe recibo para pedir reembolso?',
  'Quanto tempo dura a primeira consulta, e o retorno está incluído no valor?',
  'O procedimento pode ser feito no mesmo dia da consulta, ou sempre fica para outra data?',
  'Para a consulta de tricologia, a paciente precisa vir com o cabelo lavado (ou sem lavar)?',
].map((texto, i) => ({ id: `dm${i + 1}`, n: i + 1, texto }));

const TOTAL = PERGUNTAS.length;

const COR = {
  fundo: '#EFE7D9',
  cartao: '#FBF8F2',
  ameixa: '#7C536B',
  ameixaHover: '#634257',
  tinta: '#2C2622',
  texto: '#4A3B2E',
  suave: '#6B5C4F',
  linha: '#D9CCBA',
};

// localStorage sempre em try/catch: Safari privado lança na escrita, e uma
// falha aqui não pode travar a digitação.
const CHAVE = { respostas: 'daniela-morais:respostas', enviado: 'daniela-morais:enviado', sessao: 'daniela-morais:sessao' };

const ler = (chave) => {
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
};

const gravar = (chave, valor) => {
  try {
    window.localStorage.setItem(chave, valor);
  } catch {
    // Segue em memória.
  }
};

const lerRespostas = () => {
  try {
    const dados = JSON.parse(ler(CHAVE.respostas) || '{}');
    return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};
  } catch {
    return {};
  }
};

const sessao = () => {
  const existente = ler(CHAVE.sessao);
  if (existente) return existente;
  const novo = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
  gravar(CHAVE.sessao, novo);
  return novo;
};

const serializar = (respostas) => JSON.stringify(PERGUNTAS.map((p) => (respostas[p.id] || '').trim()));

const textoParaWhatsApp = (respostas) => {
  const partes = ['Respostas da Dra. Daniela Morais para o site'];
  PERGUNTAS.forEach((p) => {
    const r = (respostas[p.id] || '').trim();
    if (r) partes.push('', `${p.n}. ${p.texto}`, r);
  });
  return partes.join('\n');
};

export default function QuestionarioDaniela() {
  const [respostas, setRespostas] = useState(lerRespostas);
  const [estado, setEstado] = useState(() => (ler(CHAVE.enviado) ? 'enviado' : 'editando')); // editando | enviando | erro | enviado
  const [ultimoEnvio, setUltimoEnvio] = useState(() => ler(CHAVE.enviado));
  const topo = useRef(null);

  const respondidas = PERGUNTAS.filter((p) => (respostas[p.id] || '').trim()).length;
  const mudouDesdeEnvio = ultimoEnvio !== null && ultimoEnvio !== serializar(respostas);

  useEffect(() => {
    document.title = 'Perguntas para o site da Dra. Daniela';
    const raiz = document.documentElement;
    const antes = { html: raiz.style.backgroundColor, body: document.body.style.backgroundColor };
    raiz.style.backgroundColor = COR.fundo;
    document.body.style.backgroundColor = COR.fundo;
    raiz.style.colorScheme = 'light';

    // O header do vercel.json não roda em `npm run dev`; a meta cobre os dois.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);

    return () => {
      raiz.style.backgroundColor = antes.html;
      document.body.style.backgroundColor = antes.body;
      raiz.style.colorScheme = '';
      meta.remove();
    };
  }, []);

  useEffect(() => {
    if (estado === 'enviado' && topo.current) {
      window.scrollTo(0, 0);
      topo.current.focus();
    }
  }, [estado]);

  const mudar = (id, valor) => {
    setRespostas((atual) => {
      const novo = { ...atual, [id]: valor };
      gravar(CHAVE.respostas, JSON.stringify(novo));
      return novo;
    });
    if (estado === 'erro') setEstado('editando');
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (respondidas === 0 || estado === 'enviando') return;
    setEstado('enviando');
    try {
      const resp = await fetch('/api/perguntas-ligia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondente: RESPONDENTE,
          sessao: sessao(),
          respostas: PERGUNTAS.map((p) => ({
            id: p.id,
            n: p.n,
            bloco: BLOCO,
            pergunta: p.texto,
            prioridade: false,
            resposta: (respostas[p.id] || '').trim(),
          })),
        }),
      });
      const dados = await resp.json().catch(() => null);
      if (!resp.ok || !dados || dados.ok !== true) throw new Error('envio recusado');
      const assinatura = serializar(respostas);
      gravar(CHAVE.enviado, assinatura);
      setUltimoEnvio(assinatura);
      setEstado('enviado');
    } catch {
      setEstado('erro');
    }
  };

  const pagina = { minHeight: '100vh', backgroundColor: COR.fundo, color: COR.texto };
  const coluna = 'mx-auto w-full max-w-[640px] px-4 sm:px-6';

  if (estado === 'enviado') {
    return (
      <main style={pagina}>
        <div className={`${coluna} pb-16 pt-14`}>
          <h1
            ref={topo}
            tabIndex={-1}
            className="font-semibold focus:outline-none"
            style={{ color: COR.tinta, fontSize: '1.75rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Obrigado, Dra. Daniela.
          </h1>
          <p className="mt-4 text-[17px]" style={{ lineHeight: 1.55 }}>
            Recebemos as suas respostas ({respondidas} de {TOTAL}). Vamos usá-las no texto do site, e a senhora revisa tudo antes de ir ao ar.
          </p>
          <p className="mt-3 text-[15px]" style={{ color: COR.suave, lineHeight: 1.55 }}>
            Se quiser completar ou mudar alguma resposta, é só editar e enviar de novo. A versão mais recente substitui a anterior.
          </p>
          <button
            type="button"
            onClick={() => setEstado('editando')}
            className="mt-8 w-full px-5 py-3 text-[16px] font-medium sm:w-auto"
            style={{ borderRadius: 12, border: `1px solid ${COR.ameixa}`, color: COR.ameixa, backgroundColor: 'transparent', minHeight: 48 }}
          >
            Editar respostas
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={pagina}>
      <form onSubmit={enviar} noValidate>
        <div
          className="sticky top-0 z-10"
          style={{ backgroundColor: COR.fundo, borderBottom: `1px solid ${COR.linha}` }}
        >
          <div className={`${coluna} py-3`}>
            <p className="text-[15px]" style={{ color: COR.tinta, lineHeight: 1.45 }}>
              Dra. Daniela, são 10 perguntas rápidas para o seu site. Uma frase por resposta já basta.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="h-1 flex-1 overflow-hidden"
                style={{ backgroundColor: COR.linha, borderRadius: 2 }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={TOTAL}
                aria-valuenow={respondidas}
                aria-label="Perguntas respondidas"
              >
                <div
                  className="h-full transition-[width] duration-300"
                  style={{ width: `${(respondidas / TOTAL) * 100}%`, backgroundColor: COR.ameixa }}
                />
              </div>
              <span className="flex-shrink-0 text-[13px]" style={{ color: COR.suave, fontVariantNumeric: 'tabular-nums' }}>
                {respondidas} de {TOTAL}
              </span>
            </div>
          </div>
        </div>

        <div className={`${coluna} pb-16 pt-6`}>
          <p className="text-[14px]" style={{ color: COR.suave, lineHeight: 1.5 }}>
            Nenhuma é obrigatória: pode pular o que não souber agora. As respostas ficam salvas neste aparelho, então dá para fechar e continuar depois.
          </p>

          <ol className="mt-6 list-none space-y-5 p-0">
            {PERGUNTAS.map((p) => (
              <li key={p.id}>
                <label htmlFor={p.id} className="block text-[16px] font-medium" style={{ color: COR.tinta, lineHeight: 1.45 }}>
                  <span style={{ color: COR.ameixa, fontVariantNumeric: 'tabular-nums' }}>{p.n}.</span> {p.texto}
                </label>
                <textarea
                  id={p.id}
                  rows={2}
                  value={respostas[p.id] || ''}
                  onChange={(e) => mudar(p.id, e.target.value)}
                  className="daniela-campo mt-2 block w-full resize-y px-4 py-3 text-[16px] focus:outline-none"
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${COR.linha}`,
                    backgroundColor: COR.cartao,
                    color: COR.tinta,
                    lineHeight: 1.5,
                    minHeight: 56,
                  }}
                />
              </li>
            ))}
          </ol>

          {estado === 'erro' && (
            <div className="mt-8 p-4" role="alert" style={{ borderRadius: 12, border: `1px solid ${COR.ameixa}`, backgroundColor: COR.cartao }}>
              <p className="text-[15px]" style={{ color: COR.tinta, lineHeight: 1.5 }}>
                Não conseguimos enviar agora. As suas respostas continuam salvas aqui. Tente de novo em instantes ou mande pelo WhatsApp.
              </p>
              <a
                href={whatsappLink(textoParaWhatsApp(respostas))}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[15px] font-medium underline"
                style={{ color: COR.ameixa }}
              >
                Enviar pelo WhatsApp
              </a>
            </div>
          )}

          {mudouDesdeEnvio && estado !== 'erro' && (
            <p className="mt-8 text-[14px]" style={{ color: COR.suave }}>
              Há mudanças desde o último envio. Envie de novo para atualizar.
            </p>
          )}

          <button
            type="submit"
            disabled={respondidas === 0 || estado === 'enviando'}
            className="mt-6 w-full px-5 py-3 text-[16px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: 12, backgroundColor: COR.ameixa, color: '#F8F4ED', minHeight: 52 }}
          >
            {estado === 'enviando' ? 'Enviando...' : ultimoEnvio ? 'Enviar de novo' : 'Enviar respostas'}
          </button>
          {respondidas === 0 && (
            <p className="mt-3 text-center text-[13px]" style={{ color: COR.suave }}>
              Responda ao menos uma pergunta para enviar.
            </p>
          )}
        </div>
      </form>
      <style>{`.daniela-campo:focus{border-color:${COR.ameixa}!important;box-shadow:0 0 0 3px rgba(124,83,107,.18)}`}</style>
    </main>
  );
}
