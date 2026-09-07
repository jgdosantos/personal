// Testes offline de /api/perguntas-ligia. Sem rede: o fetch global é
// substituído por um stub que registra as chamadas e devolve o corpo que cada
// caso precisa. Mesmo formato de tests/brief.test.mjs.

process.env.PERGUNTAS_WEBHOOK_URL = '  https://script.google.com/macros/s/x/exec\n'; // sujo de propósito
process.env.PERGUNTAS_SECRET = '\n  segredo-limpo  \n';                             // sujo de propósito

const URL_LIMPA = 'https://script.google.com/macros/s/x/exec';
const SEGREDO_LIMPO = 'segredo-limpo';
// Resposta-sonda: um texto distinto o bastante para provar, por busca simples,
// que nada do que a cliente escreveu entra no log nem na resposta de erro.
const SONDA = 'uns 150 anéis de prata';

const calls = [];

// O caso da vez. Cada bloco de teste troca isto antes de rodar.
let cenario = { tipo: 'ok' };

globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), method: init.method, body: init.body, headers: init.headers, init });

  if (cenario.tipo === 'abort') {
    const err = new Error('abortado');
    err.name = 'AbortError';
    throw err;
  }
  if (cenario.tipo === 'rede') {
    const err = new TypeError('fetch failed');
    err.cause = { code: 'ENOTFOUND', host: 'script.google.com' };
    throw err;
  }

  const corpos = {
    ok: '{"ok":true}',
    ping: '{"ok":true,"ping":true}',
    vazio: '',
    // Página de erro do Google: traz a própria URL do webhook dentro, que é
    // exatamente o motivo de o log precisar higienizar o trecho.
    html: `<!DOCTYPE html><html><body>Erro em ${URL_LIMPA} — não foi possível abrir o arquivo</body></html>`,
    naoAutorizado: '{"ok":false,"erro":"nao autorizado"}',
  };
  const texto = corpos[cenario.tipo];
  // Todos com HTTP 200 DE PROPÓSITO: é assim que este endpoint falha na vida
  // real, e nenhum deles pode ser aceito por res.ok.
  return { ok: true, status: 200, text: async () => texto, json: async () => JSON.parse(texto) };
};

const { default: handler } = await import(new URL('../api/perguntas-ligia.js', import.meta.url));

const mkRes = () => {
  const r = { statusCode: null, payload: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (p) => { r.payload = p; return r; };
  return r;
};
const run = async (req, fn = handler) => { const res = mkRes(); await fn(req, res); return res; };

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ' — ' + extra}`);
  if (!cond) failures++;
};

const resposta = (extra = {}) => ({
  id: 'a1', n: 1, bloco: 'Suas peças',
  pergunta: 'Quantas peças diferentes você tem à venda hoje?',
  prioridade: true, resposta: SONDA, ...extra,
});
const corpoValido = (extra = {}) => ({
  respondente: 'Ligia', sessao: 's1', total: 48, preenchidas: 1,
  respostas: [resposta()], ...extra,
});

// Tudo que a rota respondeu ao cliente, para a auditoria final de vazamento.
const respostasAoCliente = [];
const post = async (body, headers = {}) => {
  const res = await run({ method: 'POST', headers, body });
  respostasAoCliente.push(JSON.stringify(res.payload));
  return res;
};

// Log capturado do começo ao fim: a promessa de privacidade do rodapé da
// página depende de o console.error não carregar segredo, URL nem resposta.
const logCru = console.error;
const logCapturado = [];
console.error = (...args) => { logCapturado.push(args.map((a) => String(a)).join(' ')); };

// ------------------------------------------------------------------ método
let res = await run({ method: 'GET' });
check('GET devolve 405', res.statusCode === 405, String(res.statusCode));
check('GET manda Allow: POST', res.headers.Allow === 'POST', String(res.headers.Allow));
check('GET responde no contrato { ok:false, erro }',
  res.payload && res.payload.ok === false && res.payload.erro === 'método não permitido',
  JSON.stringify(res.payload));
check('GET marca no-store', res.headers['Cache-Control'] === 'no-store');
check('GET não chama a planilha', calls.length === 0, String(calls.length));

for (const metodo of ['PUT', 'DELETE', 'PATCH']) {
  res = await run({ method: metodo });
  check(`${metodo} devolve 405`, res.statusCode === 405, String(res.statusCode));
}

// ------------------------------------------------------------- configuração
// O handler lê as variáveis no topo do módulo, no import. Para testar a
// ausência é preciso reavaliar o módulo: a querystring faz o Node tratar como
// especificador distinto e importar uma segunda instância.
{
  const guardado = process.env.PERGUNTAS_WEBHOOK_URL;
  delete process.env.PERGUNTAS_WEBHOOK_URL;
  const { default: semUrl } = await import(new URL('../api/perguntas-ligia.js?sem-url', import.meta.url));
  process.env.PERGUNTAS_WEBHOOK_URL = guardado;

  const antes = calls.length;
  res = await run({ method: 'POST', headers: {}, body: corpoValido() }, semUrl);
  respostasAoCliente.push(JSON.stringify(res.payload));
  check('sem PERGUNTAS_WEBHOOK_URL devolve 500', res.statusCode === 500, String(res.statusCode));
  check('o 500 de configuração não diz qual variável falta',
    !JSON.stringify(res.payload).includes('PERGUNTAS_'), JSON.stringify(res.payload));
  check('sem URL não chama a planilha', calls.length === antes, String(calls.length - antes));
}
{
  const guardado = process.env.PERGUNTAS_SECRET;
  delete process.env.PERGUNTAS_SECRET;
  const { default: semSegredo } = await import(new URL('../api/perguntas-ligia.js?sem-segredo', import.meta.url));
  process.env.PERGUNTAS_SECRET = guardado;

  const antes = calls.length;
  res = await run({ method: 'POST', headers: {}, body: corpoValido() }, semSegredo);
  respostasAoCliente.push(JSON.stringify(res.payload));
  check('sem PERGUNTAS_SECRET devolve 500', res.statusCode === 500, String(res.statusCode));
  check('sem segredo não chama a planilha', calls.length === antes, String(calls.length - antes));
}

// ------------------------------------------------------------------ tamanho
{
  const antes = calls.length;
  res = await post(corpoValido(), { 'content-length': String(201 * 1024) });
  check('content-length acima de 200KB devolve 413', res.statusCode === 413, String(res.statusCode));
  check('413 por header não chama a planilha', calls.length === antes);
}
{
  const antes = calls.length;
  const gigante = corpoValido({ respostas: [resposta({ resposta: 'x'.repeat(300 * 1024) })] });
  res = await post(gigante);
  check('corpo acima de 200KB sem content-length devolve 413', res.statusCode === 413, String(res.statusCode));
  check('413 por medição não chama a planilha', calls.length === antes);
}

// -------------------------------------------------------------- corpo e dados
res = await post('{isto não é json');
check('corpo que não parseia devolve 400', res.statusCode === 400, String(res.statusCode));

res = await post({ respondente: 'Ligia' });
check('sem respostas devolve 400', res.statusCode === 400, String(res.statusCode));
res = await post({ respostas: 'a1' });
check('respostas não-array devolve 400', res.statusCode === 400, String(res.statusCode));
res = await post({ respostas: [] });
check('respostas vazio devolve 400', res.statusCode === 400, String(res.statusCode));

// ------------------------------------------------------- caminho feliz e env
cenario = { tipo: 'ok' };
calls.length = 0;
res = await post(corpoValido());
check('envio válido devolve 200 { ok: true }',
  res.statusCode === 200 && res.payload.ok === true, JSON.stringify(res.payload));
check('marca no-store no caminho feliz', res.headers['Cache-Control'] === 'no-store');

const chamada = calls[calls.length - 1];
check('a env suja chega limpa na URL chamada', chamada.url === URL_LIMPA, chamada.url);
check('a chamada é POST', chamada.method === 'POST', String(chamada.method));
check("o fetch leva redirect: 'follow'", chamada.init.redirect === 'follow', String(chamada.init.redirect));
check('o fetch leva um signal de AbortController', Boolean(chamada.init.signal));

const enviado = JSON.parse(chamada.body);
check('o segredo vai no corpo, já aparado', enviado.segredo === SEGREDO_LIMPO, String(enviado.segredo));
check('o segredo não vai em header',
  !JSON.stringify(chamada.headers || {}).includes(SEGREDO_LIMPO), JSON.stringify(chamada.headers));
check('o segredo não vai na querystring', !chamada.url.includes(SEGREDO_LIMPO), chamada.url);
check('as chaves do corpo são as que o doPost do .gs lê',
  ['segredo', 'respondente', 'sessao', 'total', 'preenchidas', 'respostas']
    .every((k) => k in enviado),
  Object.keys(enviado).join(','));

// ----------------------------------------------------------- higienização
{
  const muitas = Array.from({ length: 250 }, (_, i) => resposta({ id: `q${i}`, n: i + 1 }));
  await post(corpoValido({ respostas: muitas }));
  const corpo = JSON.parse(calls[calls.length - 1].body);
  check('250 respostas entram, 200 saem', corpo.respostas.length === 200, String(corpo.respostas.length));
}
{
  await post(corpoValido({
    respondente: 'R'.repeat(41),
    respostas: [resposta({
      id: 'i'.repeat(21),
      bloco: 'b'.repeat(121),
      pergunta: 'p'.repeat(401),
      resposta: 'r'.repeat(4001),
      prioridade: 'sim',
      inventado: 'não deve passar',
    })],
  }));
  const corpo = JSON.parse(calls[calls.length - 1].body);
  const item = corpo.respostas[0];
  check('resposta trunca em 4000', item.resposta.length === 4000, String(item.resposta.length));
  check('pergunta trunca em 400', item.pergunta.length === 400, String(item.pergunta.length));
  check('bloco trunca em 120', item.bloco.length === 120, String(item.bloco.length));
  check('id trunca em 20', item.id.length === 20, String(item.id.length));
  check('respondente trunca em 40', corpo.respondente.length === 40, String(corpo.respondente.length));
  check("prioridade 'sim' vira booleano true", item.prioridade === true, JSON.stringify(item.prioridade));
  check('chave inventada pelo cliente não passa', !('inventado' in item), Object.keys(item).join(','));
}
{
  await post(corpoValido({ respostas: [resposta({ prioridade: 1 })] }));
  const item = JSON.parse(calls[calls.length - 1].body).respostas[0];
  check('prioridade 1 vira booleano true', item.prioridade === true);
  await post(corpoValido({ respostas: [resposta({ prioridade: 0 })] }));
  const item0 = JSON.parse(calls[calls.length - 1].body).respostas[0];
  check('prioridade 0 vira booleano false', item0.prioridade === false);
}
{
  await post(corpoValido({
    total: 999, preenchidas: 999,
    respostas: [resposta(), resposta({ id: 'a2', n: 2, resposta: '   ' }), resposta({ id: 'a3', n: 3, resposta: '' })],
  }));
  const corpo = JSON.parse(calls[calls.length - 1].body);
  check('total é recalculado no servidor', corpo.total === 3, String(corpo.total));
  check('preenchidas ignora resposta só de espaço', corpo.preenchidas === 1, String(corpo.preenchidas));
}
{
  await post(corpoValido({ respondente: '   ' }));
  const corpo = JSON.parse(calls[calls.length - 1].body);
  check("respondente em branco vira 'anonimo'", corpo.respondente === 'anonimo', corpo.respondente);
}

// ------------------------------------------------- HTTP 200 que NÃO é sucesso
// Os quatro corpos abaixo chegam com status 200. Nenhum pode virar
// "Recebido, obrigado!" na tela dela.
cenario = { tipo: 'ping' };
res = await post(corpoValido());
check('200 com { ok:true, ping:true } devolve 502 (Decisão I)', res.statusCode === 502, String(res.statusCode));
check('o ping nunca vira sucesso', res.payload.ok === false, JSON.stringify(res.payload));

cenario = { tipo: 'vazio' };
res = await post(corpoValido());
check('200 com corpo vazio devolve 502', res.statusCode === 502, String(res.statusCode));

cenario = { tipo: 'html' };
res = await post(corpoValido());
check('200 com DOCTYPE html devolve 502', res.statusCode === 502, String(res.statusCode));
check('nenhum HTML do Google chega ao cliente',
  !JSON.stringify(res.payload).toLowerCase().includes('html'), JSON.stringify(res.payload));

cenario = { tipo: 'naoAutorizado' };
res = await post(corpoValido());
check('200 com { ok:false } devolve 502', res.statusCode === 502, String(res.statusCode));
check("a string 'nao autorizado' não chega ao cliente",
  !JSON.stringify(res.payload).includes('nao autorizado'), JSON.stringify(res.payload));

// --------------------------------------------------------------- rede e timeout
cenario = { tipo: 'abort' };
res = await post(corpoValido());
check('AbortError devolve 504', res.statusCode === 504, String(res.statusCode));
check('o 504 é genérico', res.payload.erro === 'a planilha demorou demais para responder', JSON.stringify(res.payload));

cenario = { tipo: 'rede' };
res = await post(corpoValido());
check('erro de rede devolve 502', res.statusCode === 502, String(res.statusCode));
check('o 502 de rede é genérico', res.payload.erro === 'a planilha não aceitou o envio', JSON.stringify(res.payload));

// ------------------------------------------------------------------ privacidade
console.error = logCru;
const log = logCapturado.join('\n');

check('houve log de erro para auditar', logCapturado.length > 0, String(logCapturado.length));
check('o log não contém o segredo', !log.includes(SEGREDO_LIMPO), log);
check('o log não contém a URL do webhook', !log.includes(URL_LIMPA), log);
check('o log não contém o id da implantação', !/macros\/s\/(?!\[id\])/.test(log), log);
check('o log não contém nenhuma resposta da cliente', !log.includes(SONDA), log);
check('o log registra o status para o João diagnosticar', log.includes('fora do contrato'), log);
check('o log higieniza a URL que veio dentro do HTML do Google',
  log.includes('[url]') || log.includes('macros/s/[id]'), log);

const tudoQueSaiu = respostasAoCliente.join('\n');
check('nenhuma resposta ao cliente contém o segredo', !tudoQueSaiu.includes(SEGREDO_LIMPO), tudoQueSaiu);
check('nenhuma resposta ao cliente contém a URL da planilha',
  !tudoQueSaiu.includes('script.google.com'), tudoQueSaiu);

const fonte = await import('node:fs').then((fs) => fs.readFileSync(new URL('../api/perguntas-ligia.js', import.meta.url), 'utf8'));
const semComentario = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*/gm, '').toLowerCase();
for (const termo of ['x-forwarded-for', 'x-real-ip', 'x-vercel-ip', 'user-agent', 'geolocation', 'analytics']) {
  check(`a rota não toca em ${termo}`, !semComentario.includes(termo));
}

console.log(failures === 0 ? '\nTudo certo na rota das perguntas.' : `\n${failures} falha(s).`);
process.exit(failures === 0 ? 0 : 1);
