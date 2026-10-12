// Testes offline de /api/pesquisa-airbnb e do Apps Script da planilha. Sem
// rede: o fetch global é substituído por um stub que registra as chamadas e
// devolve o corpo que cada caso precisa. Mesmo formato de perguntas.test.mjs.

process.env.PESQUISA_AIRBNB_WEBHOOK_URL = '  https://script.google.com/macros/s/x/exec\n'; // sujo de propósito
process.env.PESQUISA_AIRBNB_SECRET = '\n  segredo-limpo  \n';                             // sujo de propósito

const URL_LIMPA = 'https://script.google.com/macros/s/x/exec';
const SEGREDO_LIMPO = 'segredo-limpo';
// Sondas: textos distintos o bastante para provar, por busca simples, que nada
// do que a pessoa escreveu entra no log nem na resposta de erro.
const NOME_SONDA = 'Fulana Sonda 7731';
const CONTATO_SONDA = 'sonda-7731@exemplo.com';

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
    html: `<!DOCTYPE html><html><body>Erro em ${URL_LIMPA} — não foi possível abrir o arquivo</body></html>`,
    naoAutorizado: '{"ok":false,"erro":"nao autorizado"}',
  };
  const texto = corpos[cenario.tipo];
  // Todos com HTTP 200 DE PROPÓSITO: é assim que este endpoint falha na vida
  // real, e nenhum deles pode ser aceito por res.ok.
  return { ok: true, status: 200, text: async () => texto, json: async () => JSON.parse(texto) };
};

const { default: handler } = await import(new URL('../api/pesquisa-airbnb.js', import.meta.url));
const { ESCOLHAS, LIMITES, validar } = await import(new URL('../shared/pesquisaAirbnb.js', import.meta.url));

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

const corpoValido = (extra = {}) => ({
  nome: NOME_SONDA, contato: CONTATO_SONDA,
  imoveis: '2 a 5', interesse: 'Quero muito', pagaria: 'R$ 100 a 200',
  site: '', ...extra,
});

// Tudo que a rota respondeu ao cliente, para a auditoria final de vazamento.
const respostasAoCliente = [];
const post = async (body, headers = {}) => {
  const res = await run({ method: 'POST', headers, body });
  respostasAoCliente.push(JSON.stringify(res.payload));
  return res;
};

// Log capturado do começo ao fim.
const logCru = console.error;
const logCapturado = [];
console.error = (...args) => { logCapturado.push(args.map((a) => String(a)).join(' ')); };

// ------------------------------------------------------------------ contrato
{
  // Listas literais escritas à mão a partir do formulario-validacao.md.
  const literal = [
    { id: 'imoveis', pergunta: 'Quantos imóveis estão sob sua responsabilidade?',
      opcoes: ['1', '2 a 5', '6 a 20', 'Mais de 20'] },
    { id: 'interesse', pergunta: 'O que você acha de um vídeo 3D para o seu negócio?',
      opcoes: ['Quero muito', 'Quero', 'Não faz diferença', 'Não quero', 'Jamais compraria'] },
    { id: 'pagaria', pergunta: 'Quanto você pagaria por vídeo de cada imóvel?',
      opcoes: ['Não pagaria', 'Até R$ 100', 'R$ 100 a 200', 'R$ 200 a 400', 'Mais de R$ 400'] },
  ];
  check('ESCOLHAS é idêntica ao formulario-validacao.md',
    JSON.stringify(ESCOLHAS) === JSON.stringify(literal), JSON.stringify(ESCOLHAS));
  check('LIMITES é 100 e 150', LIMITES.nome === 100 && LIMITES.contato === 150, JSON.stringify(LIMITES));
}
for (const entrada of [null, [], 'texto', 42]) {
  const r = validar(entrada);
  check(`validar(${JSON.stringify(entrada)}) é corpo inválido`,
    r.ok === false && r.erro === 'corpo inválido', JSON.stringify(r));
}

// ------------------------------------------------------------------ método
let res = await run({ method: 'GET' });
check('GET devolve 405', res.statusCode === 405, String(res.statusCode));
check('GET manda Allow: POST', res.headers.Allow === 'POST', String(res.headers.Allow));
check('GET responde no contrato { ok:false, erro }',
  res.payload && res.payload.ok === false && res.payload.erro === 'método não permitido',
  JSON.stringify(res.payload));
check('GET marca no-store', res.headers['Cache-Control'] === 'no-store');
check('GET não chama a planilha', calls.length === 0, String(calls.length));

for (const metodo of ['PUT', 'DELETE']) {
  res = await run({ method: metodo });
  check(`${metodo} devolve 405`, res.statusCode === 405, String(res.statusCode));
  check(`${metodo} manda Allow: POST`, res.headers.Allow === 'POST');
}
check('405 nunca chama a planilha', calls.length === 0, String(calls.length));

// ------------------------------------------------------------- configuração
// O handler lê as variáveis no topo do módulo. A querystring faz o Node
// importar uma segunda instância, com a env alterada.
{
  const guardado = process.env.PESQUISA_AIRBNB_WEBHOOK_URL;
  delete process.env.PESQUISA_AIRBNB_WEBHOOK_URL;
  const { default: semUrl } = await import(new URL('../api/pesquisa-airbnb.js?sem-url', import.meta.url));
  process.env.PESQUISA_AIRBNB_WEBHOOK_URL = guardado;

  const antes = calls.length;
  res = await run({ method: 'POST', headers: {}, body: corpoValido() }, semUrl);
  respostasAoCliente.push(JSON.stringify(res.payload));
  check('sem PESQUISA_AIRBNB_WEBHOOK_URL devolve 500', res.statusCode === 500, String(res.statusCode));
  check('o 500 de configuração não diz qual variável falta',
    !JSON.stringify(res.payload).includes('PESQUISA_'), JSON.stringify(res.payload));
  check('sem URL não chama a planilha', calls.length === antes, String(calls.length - antes));
}
{
  const guardado = process.env.PESQUISA_AIRBNB_SECRET;
  delete process.env.PESQUISA_AIRBNB_SECRET;
  const { default: semSegredo } = await import(new URL('../api/pesquisa-airbnb.js?sem-segredo', import.meta.url));
  process.env.PESQUISA_AIRBNB_SECRET = guardado;

  const antes = calls.length;
  res = await run({ method: 'POST', headers: {}, body: corpoValido() }, semSegredo);
  respostasAoCliente.push(JSON.stringify(res.payload));
  check('sem PESQUISA_AIRBNB_SECRET devolve 500', res.statusCode === 500, String(res.statusCode));
  check('o 500 sem segredo não diz qual variável falta',
    !JSON.stringify(res.payload).includes('PESQUISA_'), JSON.stringify(res.payload));
  check('sem segredo não chama a planilha', calls.length === antes, String(calls.length - antes));
}

// ------------------------------------------------------------------ tamanho
{
  const antes = calls.length;
  res = await post(corpoValido(), { 'content-length': String(11 * 1024) });
  check('content-length acima de 10KB devolve 413', res.statusCode === 413, String(res.statusCode));
  check('413 por header não chama a planilha', calls.length === antes);
}
{
  const antes = calls.length;
  res = await post(corpoValido({ nome: 'x'.repeat(20 * 1024) }));
  check('corpo acima de 10KB sem content-length devolve 413', res.statusCode === 413, String(res.statusCode));
  check('413 por medição não chama a planilha', calls.length === antes);
}
{
  const antes = calls.length;
  res = await post('{isto não é json');
  check('corpo que não parseia devolve 400', res.statusCode === 400, String(res.statusCode));
  check('400 de parse não chama a planilha', calls.length === antes);
}

// ------------------------------------------------------------ validação (400)
for (const [rotulo, extra] of [
  ['nome vazio', { nome: '' }],
  ['nome só de espaços', { nome: '    ' }],
  ['contato vazio', { contato: '' }],
  ['contato só de espaços', { contato: '  ' }],
  ['nome que não é string', { nome: 123 }],
]) {
  const antes = calls.length;
  res = await post(corpoValido(extra));
  check(`${rotulo} devolve 400 'preencha nome e contato'`,
    res.statusCode === 400 && res.payload.erro === 'preencha nome e contato',
    `${res.statusCode} ${JSON.stringify(res.payload)}`);
  check(`${rotulo} não chama a planilha`, calls.length === antes);
}

for (const { id } of ESCOLHAS) {
  for (const [rotulo, valor] of [
    ['texto parecido', 'Quero muitíssimo'],
    ['caixa diferente', 'quero'],
    ['espaço na ponta', ' Quero'],
    ['número', 1],
  ]) {
    const antes = calls.length;
    res = await post(corpoValido({ [id]: valor }));
    check(`${id}: ${rotulo} devolve 400 'resposta inválida'`,
      res.statusCode === 400 && res.payload.erro === 'resposta inválida',
      `${res.statusCode} ${JSON.stringify(res.payload)}`);
    check(`${id}: ${rotulo} não chama a planilha`, calls.length === antes);
  }
  const antes = calls.length;
  const sem = corpoValido();
  delete sem[id];
  res = await post(sem);
  check(`${id}: campo ausente devolve 400`, res.statusCode === 400, String(res.statusCode));
  check(`${id}: campo ausente não chama a planilha`, calls.length === antes);
}

// ------------------------------------------------------------------ honeypot
{
  cenario = { tipo: 'ok' };
  const antes = calls.length;
  res = await post(corpoValido({ site: 'http://spam.exemplo' }));
  check('honeypot preenchido devolve 200 { ok:true }',
    res.statusCode === 200 && res.payload.ok === true, JSON.stringify(res.payload));
  check('honeypot preenchido NÃO chama a planilha', calls.length === antes, String(calls.length - antes));
}

// ------------------------------------------------------- caminho feliz e env
cenario = { tipo: 'ok' };
for (const { id, opcoes } of ESCOLHAS) {
  for (const opcao of opcoes) {
    res = await post(corpoValido({ [id]: opcao }));
    check(`aceita ${id} = '${opcao}'`, res.statusCode === 200 && res.payload.ok === true,
      `${res.statusCode} ${JSON.stringify(res.payload)}`);
  }
}

calls.length = 0;
res = await post(corpoValido({ chaveInventada: 'não deve passar' }));
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
check('as chaves enviadas são exatamente as que o doPost do .gs lê',
  Object.keys(enviado).sort().join(',') === ['segredo', 'nome', 'contato', 'imoveis', 'interesse', 'pagaria'].sort().join(','),
  Object.keys(enviado).join(','));
check('chave inventada pelo cliente não passa', !('chaveInventada' in enviado));
check('o honeypot não passa para a planilha', !('site' in enviado));

// ----------------------------------------------------------- higienização
{
  await post(corpoValido({ nome: '   Maria   ', contato: '  maria@exemplo.com ' }));
  const corpo = JSON.parse(calls[calls.length - 1].body);
  check('nome chega aparado', corpo.nome === 'Maria', JSON.stringify(corpo.nome));
  check('contato chega aparado', corpo.contato === 'maria@exemplo.com', JSON.stringify(corpo.contato));
}
{
  await post(corpoValido({ nome: 'N'.repeat(101), contato: 'C'.repeat(151) }));
  const corpo = JSON.parse(calls[calls.length - 1].body);
  check('nome de 101 chars chega com 100', corpo.nome.length === 100, String(corpo.nome.length));
  check('contato de 151 chars chega com 150', corpo.contato.length === 150, String(corpo.contato.length));
}

// ------------------------------------------------- HTTP 200 que NÃO é sucesso
cenario = { tipo: 'ping' };
res = await post(corpoValido());
check('200 com { ok:true, ping:true } devolve 502', res.statusCode === 502, String(res.statusCode));
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
check('o log não contém o nome da pessoa', !log.includes(NOME_SONDA), log);
check('o log não contém o contato da pessoa', !log.includes(CONTATO_SONDA), log);
check('o log registra o status para o João diagnosticar', log.includes('fora do contrato'), log);

const tudoQueSaiu = respostasAoCliente.join('\n');
check('nenhuma resposta ao cliente contém o segredo', !tudoQueSaiu.includes(SEGREDO_LIMPO), tudoQueSaiu);
check('nenhuma resposta ao cliente contém a URL da planilha',
  !tudoQueSaiu.includes('script.google.com'), tudoQueSaiu);

const fs = await import('node:fs');
const fonte = fs.readFileSync(new URL('../api/pesquisa-airbnb.js', import.meta.url), 'utf8');
const semComentario = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*/gm, '').toLowerCase();
for (const termo of ['x-forwarded-for', 'x-real-ip', 'x-vercel-ip', 'user-agent', 'geolocation', 'analytics']) {
  check(`a rota não toca em ${termo}`, !semComentario.includes(termo));
}
check('a rota não usa as variáveis de outras planilhas',
  !semComentario.includes('perguntas_') && !semComentario.includes('sheets_'));

// ------------------------------------------------------------- Apps Script
// O .gs roda num vm do Node com stubs das três APIs do Google que ele usa
// (ContentService, LockService, SpreadsheetApp). As `function` de topo viram
// propriedades do contexto; `const` de topo não, por isso o segredo é lido do
// texto do arquivo.
{
  const vm = await import('node:vm');
  const fonteGs = fs.readFileSync(new URL('../docs/apps-script-pesquisa-airbnb.gs', import.meta.url), 'utf8');
  const SEGREDO_GS = (/const SEGREDO = '([^']*)'/.exec(fonteGs) || [])[1] || '';

  const lock = { espera: 0, libera: 0 };
  const abas = new Map(); // nome -> { linhas, negrito, congeladas }
  let abasCriadas = 0;

  const novaAba = () => {
    const aba = { linhas: [], negrito: [], congeladas: 0 };
    aba.appendRow = (linha) => { aba.linhas.push(linha); };
    aba.getRange = () => {
      const r = { setFontWeight: (peso) => { aba.negrito.push(peso); return r; } };
      return r;
    };
    aba.setFrozenRows = (n) => { aba.congeladas = n; };
    return aba;
  };
  const planilha = {
    getSheetByName: (nome) => abas.get(nome) || null,
    insertSheet: (nome) => { const aba = novaAba(); abas.set(nome, aba); abasCriadas++; return aba; },
  };

  const ctx = vm.createContext({
    ContentService: {
      createTextOutput: (s) => ({ setMimeType: () => ({ conteudo: s }) }),
      MimeType: { JSON: 'JSON' },
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => { lock.espera++; },
        releaseLock: () => { lock.libera++; },
      }),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => planilha },
  });
  vm.runInContext(fonteGs, ctx);

  const doPost = (corpo) => JSON.parse(
    ctx.doPost({ postData: { contents: typeof corpo === 'string' ? corpo : JSON.stringify(corpo) } }).conteudo,
  );
  const gsValido = (extra = {}) => ({
    segredo: SEGREDO_GS, nome: 'Maria', contato: 'maria@exemplo.com',
    imoveis: '2 a 5', interesse: 'Quero', pagaria: 'Até R$ 100', ...extra,
  });

  check('o .gs tem um SEGREDO a trocar', SEGREDO_GS.length > 0);
  check('o .gs não cita PERGUNTAS_ nem SHEETS_', !/PERGUNTAS_|SHEETS_/.test(fonteGs));
  check('doGet devolve { ok:true, ping:true }',
    JSON.stringify(JSON.parse(ctx.doGet().conteudo)) === '{"ok":true,"ping":true}');

  let r = doPost(gsValido());
  check('doPost válido devolve { ok:true }', r.ok === true && r.ping === undefined, JSON.stringify(r));
  const aba = abas.get('Respostas');
  check("cria a aba 'Respostas'", Boolean(aba));
  check('cria a aba uma vez só', abasCriadas === 1, String(abasCriadas));
  check('cabeçalho certo na primeira linha',
    aba && JSON.stringify(aba.linhas[0]) === JSON.stringify(['Quando', 'Nome', 'Contato', 'Imóveis', 'Interesse', 'Quanto pagaria']),
    aba && JSON.stringify(aba.linhas[0]));
  check('cabeçalho em negrito', aba && aba.negrito.includes('bold'));
  check('cabeçalho congelado', aba && aba.congeladas === 1, aba && String(aba.congeladas));
  check('1 linha de dados depois do cabeçalho', aba && aba.linhas.length === 2, aba && String(aba.linhas.length));
  const linha = aba && aba.linhas[1];
  check('a linha é [Date, nome, contato, imoveis, interesse, pagaria]',
    linha && Object.prototype.toString.call(linha[0]) === '[object Date]'
      && JSON.stringify(linha.slice(1)) === JSON.stringify(['Maria', 'maria@exemplo.com', '2 a 5', 'Quero', 'Até R$ 100']),
    JSON.stringify(linha));

  r = doPost(gsValido({ nome: 'Joana' }));
  check('segundo doPost devolve { ok:true }', r.ok === true);
  check('segundo doPost não recria a aba', abasCriadas === 1, String(abasCriadas));
  check('segundo doPost só acrescenta 1 linha, sem repetir o cabeçalho',
    aba.linhas.length === 3 && aba.linhas[2][1] === 'Joana', String(aba.linhas.length));

  const antes = aba.linhas.length;
  r = doPost(gsValido({ segredo: 'errado' }));
  check("segredo errado devolve { ok:false, erro:'nao autorizado' }",
    r.ok === false && r.erro === 'nao autorizado', JSON.stringify(r));
  check('segredo errado não grava nada', aba.linhas.length === antes);
  r = doPost(gsValido({ segredo: undefined }));
  check('sem segredo devolve nao autorizado', r.ok === false && r.erro === 'nao autorizado');

  doPost(gsValido({
    nome: '=HYPERLINK("x")', contato: '+55 11 99999-0000', imoveis: '-1', interesse: '@a', pagaria: '2 a 5',
  }));
  const perigosa = aba.linhas[aba.linhas.length - 1];
  check("nome '=HYPERLINK(...)' ganha apóstrofo", perigosa[1] === '\'=HYPERLINK("x")', perigosa[1]);
  check("contato '+55...' ganha apóstrofo", perigosa[2] === "'+55 11 99999-0000", perigosa[2]);
  check("'-1' ganha apóstrofo", perigosa[3] === "'-1", perigosa[3]);
  check("'@a' ganha apóstrofo", perigosa[4] === "'@a", perigosa[4]);
  check("'2 a 5' fica igual", perigosa[5] === '2 a 5', perigosa[5]);
  check("'Maria' fica igual", aba.linhas[1][1] === 'Maria', aba.linhas[1][1]);

  r = doPost('{isto não é json');
  check('corpo que não parseia devolve { ok:false }', r.ok === false, JSON.stringify(r));

  check('o lock é pedido em todo doPost', lock.espera === 6, String(lock.espera));
  check('o lock é liberado em todo caminho (sucesso, segredo errado, corpo ruim)',
    lock.libera === lock.espera, `${lock.libera}/${lock.espera}`);
}

console.log(failures === 0 ? '\nTudo certo na pesquisa Airbnb.' : `\n${failures} falha(s).`);
process.exit(failures === 0 ? 0 : 1);
