// Todo o acesso a localStorage da página /decisoes-ligia mora aqui, e TODO ele
// dentro de try/catch.
//
// O Safari em modo privado lança na primeira escrita. Se um setItem solto
// explodisse no meio de um onChange, o marcar-opção dela pararia — e a promessa
// central da página ("pode fechar e voltar depois") viraria uma tela travada.
// A regra é sempre a mesma: falhou, segue em memória, a página continua
// funcionando. Mesmo espírito de src/perguntas/storage.js e src/brief/token.js.

import { PERGUNTAS, RESPONDENTE, respostaDe } from './content.js';

/**
 * Namespace próprio, `decisoes:`, que NÃO pode colidir com o `perguntas:` da
 * página irmã: são duas páginas, dois conjuntos de respostas, e a Ligia
 * provavelmente tem as duas no mesmo navegador. Chave compartilhada faria uma
 * apagar a outra em silêncio.
 *
 * Sem `?p=` aqui, diferente da irmã: esta página tem uma respondente só, e o
 * nome é o que separa a aba da planilha (D-03). Deixar o nome vir da URL
 * permitiria que um link errado gravasse as decisões numa aba nova.
 */
export const chaves = () => ({
  respostas: `decisoes:${RESPONDENTE}`,
  sessao: `decisoes:${RESPONDENTE}:sessao`,
  enviado: `decisoes:${RESPONDENTE}:enviado`,
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
    // dela no meio de uma escolha.
    return false;
  }
};

/**
 * Objeto { id: { opcao, texto } }.
 *
 * Aqui o valor é um objeto, não uma string como na página irmã — e é por isso
 * que a limpeza é item a item: uma chave órfã de versão antiga (ou de outra
 * página que tenha usado o mesmo prefixo) chegaria como string e faria
 * `valor.texto` estourar dentro do render. Item que não tem a forma esperada é
 * descartado; o resto das respostas dela sobrevive.
 *
 * Devolve {} em qualquer falha: ausente, JSON corrompido, storage bloqueado.
 */
export const lerRespostas = () => {
  const cru = ler(chaves().respostas);
  if (!cru) return {};

  let dados;
  try {
    dados = JSON.parse(cru);
  } catch {
    return {};
  }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return {};

  const limpo = {};
  Object.keys(dados).forEach((id) => {
    const item = dados[id];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    limpo[id] = {
      opcao: typeof item.opcao === 'string' ? item.opcao : '',
      texto: typeof item.texto === 'string' ? item.texto : '',
    };
  });
  return limpo;
};

export const gravarRespostas = (respostas) => {
  gravar(chaves().respostas, JSON.stringify(respostas));
};

/**
 * Id aleatório persistido. Acompanha cada envio e é o que permite ao João
 * distinguir "ela reenviou" de "outra pessoa respondeu" na aba Historico.
 */
export const lerOuCriarSessao = () => {
  const chave = chaves().sessao;
  const existente = ler(chave);
  if (existente) return existente;
  const novo = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
  gravar(chave, novo);
  return novo;
};

/**
 * Serialização das respostas, usada para guardar o último envio bem-sucedido.
 *
 * É o que faz o aviso "Você tem respostas novas para enviar" aparecer só quando
 * ela realmente mudou algo depois de enviar.
 *
 * Canônica de propósito — percorre PERGUNTAS na ordem e guarda o que de fato
 * vai para a planilha (`respostaDe`), não o objeto cru. Duas razões: o
 * JSON.stringify do objeto dependeria da ordem de inserção das chaves, então
 * desmarcar e remarcar a mesma opção produziria uma string diferente para um
 * conteúdo idêntico; e o texto do campo "Outro" guardado com a opção desmarcada
 * não muda nada do que a planilha recebe — comparar o objeto cru faria o aviso
 * aparecer por uma diferença que não existe do lado de lá.
 */
export const serializar = (respostas) => JSON.stringify(
  PERGUNTAS.map((p) => respostaDe(p, respostas[p.id])),
);

export const lerUltimoEnvio = () => ler(chaves().enviado);

export const gravarUltimoEnvio = (respostas) => {
  gravar(chaves().enviado, serializar(respostas));
};
