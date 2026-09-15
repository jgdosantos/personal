// O plano B: o que acontece quando o envio falha.
//
// Sem React aqui de propósito — são funções puras, testáveis a olho. O objetivo
// delas não é "abrir o WhatsApp", é AS ESCOLHAS DELA CHEGAREM. Se a planilha
// estiver fora do ar, ela ainda tem duas saídas e não perde uma decisão.

import { SECOES, PERGUNTAS, TOTAL, RESPONDENTE, copy, semTags, respostaDe } from './content.js';
import { whatsappLink } from '../lib/whatsapp.js';

// 1400 caracteres do texto CRU, mesmo limite da página irmã. A inflação do
// encodeURIComponent não entra na conta.
const LIMITE_WHATSAPP = 1400;

/**
 * Texto legível para humano — é o João que vai ler isto no WhatsApp.
 *
 * As perguntas NÃO respondidas ficam de fora. Este texto não é o payload da
 * API: aquele manda as 16, inclusive as vazias, porque a planilha quer os
 * buracos visíveis. Aqui, buraco só faria a mensagem ficar ilegível.
 */
export const montarTexto = ({ respostas }) => {
  const preenchidas = PERGUNTAS.filter((p) => respostaDe(p, respostas[p.id])).length;
  const partes = [`Decisões de ${RESPONDENTE} — ${preenchidas} de ${TOTAL}`];

  SECOES.forEach((secao) => {
    const respondidas = secao.qs
      .map((pergunta) => PERGUNTAS.find((p) => p.id === pergunta.id))
      .filter((p) => p && respostaDe(p, respostas[p.id]));
    if (respondidas.length === 0) return;

    partes.push('');
    partes.push(secao.rotulo ? `${secao.rotulo} — ${secao.t}` : secao.t);
    respondidas.forEach((p) => {
      partes.push('');
      partes.push(`${p.n}. ${semTags(p.titulo)}`);
      partes.push(respostaDe(p, respostas[p.id]));
    });
  });

  return partes.join('\n');
};

/**
 * Copia para a área de transferência. Nunca termina em silêncio: devolve
 * `false` quando não conseguiu, para a interface mostrar o texto num campo
 * selecionável e ela copiar na mão.
 *
 * DUPLICADA de perguntas/fallback.js de propósito: importar de lá arrastaria as
 * 48 perguntas do briefing para o bundle desta página, e aquele arquivo está
 * congelado (D-04).
 */
export const copiar = async (texto) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Contexto não seguro ou permissão negada: cai no caminho antigo.
  }

  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
};

/**
 * Decide o que mandar no WhatsApp.
 *
 * O link vai direto para o João, via whatsappLink(). NÃO montar
 * `https://wa.me/...` à mão aqui: o número tem um dono só, src/lib/whatsapp.js,
 * e já foi corrigido uma vez (faltava o 9 inicial).
 *
 * Acima de 1400 caracteres o texto inteiro vai para o clipboard e a conversa
 * abre só com a frase curta — quem chama é que dispara a cópia, para o clique
 * dela continuar sendo uma navegação nativa, sem popup bloqueado.
 */
export const planoWhatsApp = (texto) => (
  texto.length > LIMITE_WHATSAPP
    ? { href: whatsappLink(copy.fallback.mensagemCurta), curta: true }
    : { href: whatsappLink(texto), curta: false }
);
