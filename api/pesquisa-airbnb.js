// Vercel Serverless Function — respostas da pesquisa /pesquisa-airbnb.
//
// POST /api/pesquisa-airbnb  → valida, higieniza e repassa para o Apps Script
//                              que grava na planilha do João.
// Qualquer outro método      → 405.
//
// ENDPOINT PRÓPRIO, VARIÁVEIS PRÓPRIAS: PESQUISA_AIRBNB_WEBHOOK_URL e
// PESQUISA_AIRBNB_SECRET. É outra planilha, outra feature; reusar PERGUNTAS_*
// ou SHEETS_* amarraria destinos diferentes ao mesmo valor.
//
// ALLOWLIST: as 3 escolhas precisam estar EXATAMENTE nas listas de
// shared/pesquisaAirbnb.js, a mesma que o front desenha. Qualquer outra coisa
// é 400. Nome e contato são aparados e cortados.
//
// HONEYPOT: o campo `site` é invisível para humano. Preenchido, é bot: a rota
// responde 200 sem chamar a planilha e sem logar.
//
// O corpo de erro é `{ ok: false, erro }`, o mesmo contrato de
// /api/perguntas-ligia.
//
// PRIVACIDADE: esta rota não lê IP, user-agent, geolocalização nem roda
// analytics, e nunca loga nome, contato nem o payload.

import { validar } from '../shared/pesquisaAirbnb.js';

// Colar valor no painel da Vercel arrasta espaço e quebra de linha invisíveis
// junto, e um "\n" dentro de um header derruba o fetch.
const env = (name) => (process.env[name] || '').trim();

const WEBHOOK_URL = env('PESQUISA_AIRBNB_WEBHOOK_URL');
const SECRET = env('PESQUISA_AIRBNB_SECRET');

// 5 campos curtos: qualquer coisa acima de 10KB é engano ou abuso.
const LIMITE_BYTES = 10 * 1024;
const TIMEOUT_MS = 15000;

/**
 * Trecho curto e higienizado para o log. A página de erro do Google costuma
 * trazer a própria URL do webhook dentro; registrar o corpo cru vazaria o
 * endereço da planilha no painel da Vercel.
 */
const trecho = (valor) => {
  let texto = String(valor).slice(0, 120);
  if (WEBHOOK_URL) texto = texto.split(WEBHOOK_URL).join('[url]');
  if (SECRET) texto = texto.split(SECRET).join('[segredo]');
  return texto.replace(/macros\/s\/[^/\s"']+/g, 'macros/s/[id]');
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

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

    // Honeypot: bot recebe "ok" e a planilha nunca é tocada.
    if (payload && typeof payload.site === 'string' && payload.site.trim()) {
      return res.status(200).json({ ok: true });
    }

    const v = validar(payload);
    if (!v.ok) {
      return res.status(400).json({ ok: false, erro: v.erro });
    }
    const { dados: campos } = v;

    if (!WEBHOOK_URL || !SECRET) {
      // Sem dizer QUAL falta: a mensagem vai para o navegador do visitante.
      console.error('[pesquisa-airbnb] variável de ambiente ausente');
      return res.status(500).json({ ok: false, erro: 'a planilha não está configurada' });
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    let resposta;
    let texto;
    try {
      // `redirect: 'follow'` explícito: o /exec responde 302 para
      // script.googleusercontent.com, e sem seguir o redirect vem HTML.
      //
      // O segredo vai NO CORPO, nunca em header nem na querystring. As chaves
      // são exatamente as que o doPost do .gs lê.
      resposta = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        signal: ctrl.signal,
        body: JSON.stringify({
          segredo: SECRET,
          nome: campos.nome,
          contato: campos.contato,
          imoveis: campos.imoveis,
          interesse: campos.interesse,
          fotos: campos.fotos,
        }),
      });
      texto = await resposta.text();
    } catch (err) {
      // Nunca `console.error(err)` cru: a `cause` de um erro de rede carrega
      // host e caminho do destino.
      console.error('[pesquisa-airbnb] falha ao repassar para a planilha:', err?.name || 'erro', err?.cause?.code || '');
      if (err?.name === 'AbortError') {
        return res.status(504).json({ ok: false, erro: 'a planilha demorou demais para responder' });
      }
      return res.status(502).json({ ok: false, erro: 'a planilha não aceitou o envio' });
    } finally {
      clearTimeout(timer);
    }

    // HTTP 200 NÃO É SUCESSO. Corpo vazio, HTML do Google, { ok: false } e
    // { ok: true, ping: true } (o doGet respondendo no lugar do doPost, logo
    // após uma implantação) chegam todos com status 200. Se qualquer um virasse
    // "Obrigado!", a pessoa fecharia a página achando que respondeu e a linha
    // nunca chegaria na planilha. Sucesso é `ok === true` E ausência de `ping`.
    let dados = null;
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }

    if (dados && dados.ok === true && dados.ping === undefined) {
      return res.status(200).json({ ok: true });
    }

    console.error('[pesquisa-airbnb] a planilha respondeu fora do contrato; status', resposta.status, trecho(texto));
    return res.status(502).json({ ok: false, erro: 'a planilha não aceitou o envio' });
  } catch (err) {
    console.error('[pesquisa-airbnb]', err?.name || 'erro');
    return res.status(500).json({ ok: false, erro: 'erro interno' });
  }
}
