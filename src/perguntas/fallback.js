// O plano B: o que acontece quando o envio falha.
//
// Sem React aqui de propósito — são funções puras, testáveis a olho. O
// objetivo delas não é "abrir o WhatsApp", é AS RESPOSTAS CHEGAREM. Se a
// planilha estiver fora do ar, ela ainda tem duas saídas e não perde uma
// letra do que escreveu.

import { BLOCOS, PERGUNTAS, TOTAL, semTags } from './content.js';
import { copy } from './content.js';
import { whatsappLink } from '../lib/whatsapp.js';

// O brief conta 1400 caracteres do texto CRU. A inflação do
// encodeURIComponent não entra na conta.
const LIMITE_WHATSAPP = 1400;

/**
 * Texto legível para humano — é o João que vai ler isto no WhatsApp.
 *
 * As perguntas NÃO respondidas ficam de fora. Este texto não é o payload da
 * API: aquele manda as 48, inclusive as vazias, porque a planilha quer os
 * buracos visíveis. Aqui, buraco só faria a mensagem ficar ilegível.
 */
export const montarTexto = ({ respondente, respostas }) => {
  const preenchidas = PERGUNTAS.filter((p) => (respostas[p.id] || '').trim()).length;
  const partes = [`Respostas de ${respondente} — ${preenchidas} de ${TOTAL}`];

  BLOCOS.forEach((bloco) => {
    const respondidas = bloco.qs
      .map(([id]) => PERGUNTAS.find((p) => p.id === id))
      .filter((p) => p && (respostas[p.id] || '').trim());
    if (respondidas.length === 0) return;

    partes.push('');
    partes.push(bloco.t);
    respondidas.forEach((p) => {
      partes.push('');
      partes.push(`${p.n}. ${semTags(p.texto)}`);
      partes.push(respostas[p.id].trim());
    });
  });

  return partes.join('\n');
};

/**
 * Copia para a área de transferência. Nunca termina em silêncio: devolve
 * `false` quando não conseguiu, para a interface mostrar o texto num campo
 * selecionável e ela copiar na mão.
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
 * O link vai direto para o João, via whatsappLink() — decisão do usuário em
 * 2026-09-07, divergindo do `wa.me` sem número do brief. O objetivo do plano B
 * é as respostas chegarem, e um wa.me sem destinatário obrigaria a Ligia a
 * achar o João na lista de contatos justamente no momento em que um envio
 * acabou de falhar. Um passo a menos numa hora ruim.
 *
 * NÃO montar `https://wa.me/...` à mão aqui: o número tem um dono só,
 * src/lib/whatsapp.js, e já foi corrigido uma vez (faltava o 9 inicial).
 *
 * Acima de 1400 caracteres o texto inteiro vai para o clipboard e a conversa
 * abre só com a frase curta — quem chama é que dispara a cópia, para o clique
 * dela continuar sendo uma navegação nativa, sem popup bloqueado.
 *
 * Devolve { href, curta } para a interface poder dizer a verdade na tela.
 */
export const planoWhatsApp = (texto) => (
  texto.length > LIMITE_WHATSAPP
    ? { href: whatsappLink(copy.fallback.mensagemCurta), curta: true }
    : { href: whatsappLink(texto), curta: false }
);
