// Todo o acesso a localStorage da página /perguntas-ligia mora aqui, e TODO
// ele dentro de try/catch.
//
// O Safari em modo privado lança na primeira escrita. Se um setItem solto
// explodisse no meio de um onChange, a digitação dela pararia — e a promessa
// central da página ("pode fechar e voltar depois") viraria uma tela travada.
// A regra é sempre a mesma: falhou, segue em memória, a página continua
// funcionando. Mesmo espírito de src/brief/token.js.

const PADRAO = 'Ligia';

/**
 * Lê o `?p=Nome` da URL. Padrão: Ligia.
 *
 * Este nome vira DUAS coisas: o nome da aba na planilha e a chave do
 * localStorage. O corte em 40 é o mesmo do servidor e o mesmo do slice(0, 40)
 * do Apps Script — três lugares com o mesmo limite de propósito, para o nome
 * da aba nunca divergir da chave local.
 */
export const respondenteDaUrl = () => {
  if (typeof window === 'undefined') return PADRAO;
  try {
    const bruto = new URLSearchParams(window.location.search).get('p') || '';
    return bruto.trim().slice(0, 40) || PADRAO;
  } catch {
    return PADRAO;
  }
};

// Namespace próprio, para não colidir com brief:token nem com nada futuro.
export const chaves = (respondente) => ({
  respostas: `perguntas:${respondente}`,
  sessao: `perguntas:${respondente}:sessao`,
  enviado: `perguntas:${respondente}:enviado`,
});

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
    return true;
  } catch {
    // Best-effort silencioso: storage bloqueado não pode virar erro na cara
    // dela no meio de uma frase.
    return false;
  }
};

/** Objeto { id: texto }. Devolve {} em qualquer falha: ausente, JSON corrompido, storage bloqueado. */
export const lerRespostas = (respondente) => {
  const cru = ler(chaves(respondente).respostas);
  if (!cru) return {};
  try {
    const dados = JSON.parse(cru);
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return {};
    return dados;
  } catch {
    return {};
  }
};

export const gravarRespostas = (respondente, respostas) => {
  gravar(chaves(respondente).respostas, JSON.stringify(respostas));
};

/**
 * Id aleatório persistido. Acompanha cada envio e é o que permite ao João
 * distinguir "ela reenviou" de "outra pessoa respondeu" na aba Historico.
 */
export const lerOuCriarSessao = (respondente) => {
  const chave = chaves(respondente).sessao;
  const existente = ler(chave);
  if (existente) return existente;
  const novo = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
  gravar(chave, novo);
  return novo;
};

/**
 * Serialização exata das respostas do último envio bem-sucedido.
 *
 * É o que faz o aviso "Você tem respostas novas para enviar" aparecer só
 * quando ela realmente mudou algo depois de enviar. Comparar strings
 * serializadas em vez de inventar um hash: não colide, não tem borda, e 10 KB
 * a mais no storage não é problema para ninguém.
 */
export const lerUltimoEnvio = (respondente) => ler(chaves(respondente).enviado);

export const gravarUltimoEnvio = (respondente, respostas) => {
  gravar(chaves(respondente).enviado, JSON.stringify(respostas));
};
