// Vercel Serverless Function — respostas do questionário /perguntas-ligia.
//
// POST /api/perguntas-ligia  → valida, higieniza e repassa para o Apps Script
//                              que grava na planilha privada do João.
// Qualquer outro método       → 405.
//
// DUAS DIVERGÊNCIAS DELIBERADAS EM RELAÇÃO AO RESTO DO REPOSITÓRIO:
//
// 1. O corpo de erro é `{ ok: false, erro }`, não o `{ error }` de
//    /api/brief e /api/comments. É o contrato que o BRIEF.md fixou e que o
//    cliente desta página lê com um `if (!data.ok)`. Misturar as duas formas
//    DENTRO do mesmo endpoint — `erro` nos 4xx e `error` no 405 — seria pior
//    que a divergência entre rotas.
//
// 2. As variáveis são PERGUNTAS_WEBHOOK_URL / PERGUNTAS_SECRET, não os
//    SHEETS_* que o brief pedia. SHEETS_WEBHOOK_URL já existe no
//    .env.example, reservada para a planilha do briefing de marca — outra
//    planilha, outra feature. Reusar amarraria as duas ao mesmo destino, e
//    SHEETS_SECRET ao lado de SHEETS_WEBHOOK_SECRET no painel da Vercel é o
//    formato clássico do erro de configuração que ninguém depura.
//
// PRIVACIDADE: esta rota não lê IP, user-agent, geolocalização nem roda
// analytics, e nada disso pode ser adicionado. O rodapé da página promete
// à cliente que só as respostas saem daqui, e a promessa tem de ser literal.

// Colar valor no painel da Vercel arrasta espaço e quebra de linha invisíveis
// junto, e um "\n" dentro de um header derruba o fetch com "invalid header
// value". Mesma defesa de /api/brief e /api/comments, que já foram mordidos
// por isso em produção.
const env = (name) => (process.env[name] || '').trim();

const WEBHOOK_URL = env('PERGUNTAS_WEBHOOK_URL');
const SECRET = env('PERGUNTAS_SECRET');

// A Vercel já recusa corpo acima de 4,5 MB antes de a função rodar. Os 200KB
// são a regra da aplicação, mais apertada de propósito: 48 respostas de texto
// não chegam nem perto disso, então qualquer coisa maior é engano ou abuso.
const LIMITE_BYTES = 200 * 1024;
const MAX_ITENS = 200;
const TIMEOUT_MS = 15000;

// Os limites do brief, num lugar só.
const CORTES = { resposta: 4000, pergunta: 400, bloco: 120, id: 20, respondente: 40 };

const corta = (valor, n) => String(valor ?? '').slice(0, n);

/**
 * Trecho curto e higienizado para o log.
 *
 * A página de erro do Google costuma trazer a própria URL do webhook dentro,
 * então registrar o corpo cru vazaria o endereço da planilha no painel da
 * Vercel. O replace final pega a URL em qualquer forma — inclusive a do
 * script.googleusercontent.com, que não é a da env var.
 */
const trecho = (valor) => {
  let texto = String(valor).slice(0, 120);
  if (WEBHOOK_URL) texto = texto.split(WEBHOOK_URL).join('[url]');
  if (SECRET) texto = texto.split(SECRET).join('[segredo]');
  return texto.replace(/macros\/s\/[^/\s"']+/g, 'macros/s/[id]');
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // O método vem ANTES da checagem de configuração: um ambiente sem env var
  // responderia 500 a um GET, e o critério de aceite 5 do brief ("GET devolve
  // 405") falharia pelo motivo errado.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, erro: 'método não permitido' });
  }

  try {
    const declarado = Number((req.headers || {})['content-length']);
    const medido = typeof req.body === 'string'
      ? Buffer.byteLength(req.body)
      : Buffer.byteLength(JSON.stringify(req.body ?? ''));
    const bytes = Number.isFinite(declarado) && declarado > 0 ? declarado : medido;
    if (bytes > LIMITE_BYTES) {
      return res.status(413).json({ ok: false, erro: 'envio grande demais' });
    }

    let payload;
    try {
      payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch {
      return res.status(400).json({ ok: false, erro: 'corpo inválido' });
    }

    if (!Array.isArray(payload.respostas) || payload.respostas.length === 0) {
      return res.status(400).json({ ok: false, erro: 'nenhuma resposta recebida' });
    }

    if (!WEBHOOK_URL || !SECRET) {
      // Sem dizer QUAL falta: a mensagem vai para o navegador dela. O log sem
      // nome nem valor já basta para o João entender o que aconteceu.
      console.error('[perguntas] variável de ambiente ausente');
      return res.status(500).json({ ok: false, erro: 'a planilha não está configurada' });
    }

    // Objeto novo, campo a campo. Nunca espalhar o do cliente: qualquer chave
    // extra que ele inventasse seguiria direto para a planilha.
    const respostas = payload.respostas.slice(0, MAX_ITENS).map((r) => ({
      id: corta(r && r.id, CORTES.id),
      n: Number(r && r.n) || 0,
      bloco: corta(r && r.bloco, CORTES.bloco),
      pergunta: corta(r && r.pergunta, CORTES.pergunta),
      prioridade: Boolean(r && r.prioridade),
      resposta: corta(r && r.resposta, CORTES.resposta),
    }));

    const respondente = corta(payload.respondente, CORTES.respondente).trim() || 'anonimo';
    const sessao = corta(payload.sessao, 64);

    // Recalculados no servidor, nunca copiados do cliente: depois do corte em
    // 200 itens os números dele podem divergir do que efetivamente chegou, e é
    // este número que vira o "12/48" da aba Historico.
    const total = respostas.length;
    const preenchidas = respostas.filter((r) => r.resposta.trim()).length;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    let resposta;
    let texto;
    try {
      // `redirect: 'follow'` é explícito mesmo sendo o padrão do Node — é a
      // pegadinha número um desta integração. O /exec responde 302 para
      // script.googleusercontent.com, e sem seguir o redirect você recebe uma
      // página HTML do Google em vez do JSON.
      //
      // O segredo vai NO CORPO, nunca em header nem na querystring: header e
      // URL aparecem em log de proxy, corpo não. As chaves são exatamente as
      // que o doPost do .gs lê.
      resposta = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        signal: ctrl.signal,
        body: JSON.stringify({ segredo: SECRET, respondente, sessao, total, preenchidas, respostas }),
      });
      texto = await resposta.text();
    } catch (err) {
      // Nunca `console.error(err)` cru nem `String(err)`: a `cause` de um erro
      // de rede carrega host e caminho do destino.
      console.error('[perguntas] falha ao repassar para a planilha:', err?.name || 'erro', err?.cause?.code || '');
      if (err?.name === 'AbortError') {
        return res.status(504).json({ ok: false, erro: 'a planilha demorou demais para responder' });
      }
      return res.status(502).json({ ok: false, erro: 'a planilha não aceitou o envio' });
    } finally {
      clearTimeout(timer);
    }

    // ------------------------------------------------------------------
    // O ponto mais importante do arquivo.
    //
    // HTTP 200 NÃO É SUCESSO. Os quatro modos de falha conhecidos deste
    // endpoint chegam todos com status 200: corpo vazio, HTML do Google,
    // { ok: false } e — observado em produção logo após uma implantação —
    // { ok: true, ping: true }, que é a resposta do doGet respondendo no
    // lugar do doPost.
    //
    // Se qualquer um deles virasse "Recebido, obrigado!", a Ligia fecharia a
    // página achando que entregou e a planilha estaria vazia; ninguém
    // descobriria até o João abrir a planilha, quando já não dá para pedir de
    // novo sem queimar a boa vontade dela. Um fallback indevido custa um
    // incômodo. A assimetria decide: sucesso é `ok === true` E ausência de
    // `ping`, e nada mais.
    // ------------------------------------------------------------------
    let dados = null;
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }

    if (dados && dados.ok === true && dados.ping === undefined) {
      return res.status(200).json({ ok: true });
    }

    // Trecho higienizado no log: sem ele não há como distinguir "implantação
    // velha" de "segredo errado" de "propagação". O corpo da planilha nunca
    // chega ao navegador dela.
    console.error('[perguntas] a planilha respondeu fora do contrato; status', resposta.status, trecho(texto));
    return res.status(502).json({ ok: false, erro: 'a planilha não aceitou o envio' });
  } catch (err) {
    console.error('[perguntas]', err?.name || 'erro');
    return res.status(500).json({ ok: false, erro: 'erro interno' });
  }
}
